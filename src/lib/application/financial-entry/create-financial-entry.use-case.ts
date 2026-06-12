import {
  AccountType,
  CategoryType,
  EntryFrequencyProfile,
  EntryOrigin,
  EntryType,
  InstallmentStatus,
  PaymentMethod,
  SettlementStatus,
} from "@prisma/client";

import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { normalizeDateInput, startOfMonth } from "@/lib/utils/date";
import { CreateFinancialEntryInput } from "@/features/lancamentos/schemas/create-financial-entry-schema";
import {
  calculateCreditCardBillingDate,
  isCreditCardPaymentMethod,
  requireCreditCardBillingConfig,
} from "@/lib/application/financial-entry/credit-card-billing";

function resolveSettlementStatus(
  paymentMethod: PaymentMethod,
  requestedStatus: SettlementStatus,
) {
  if (
    paymentMethod === PaymentMethod.PIX ||
    paymentMethod === PaymentMethod.DEBIT ||
    paymentMethod === PaymentMethod.CASH
  ) {
    return SettlementStatus.SETTLED;
  }

  return requestedStatus;
}

function splitInstallments(totalAmount: number, installmentCount: number) {
  const totalInCents = Math.round(totalAmount * 100);
  const baseInstallment = Math.floor(totalInCents / installmentCount);
  const remainder = totalInCents % installmentCount;

  return Array.from({ length: installmentCount }, (_, index) => {
    const cents = baseInstallment + (index < remainder ? 1 : 0);
    return cents / 100;
  });
}

export async function createFinancialEntryUseCase(input: CreateFinancialEntryInput) {
  const userId = await requireCurrentUserId();
  const eventDate = normalizeDateInput(input.eventDate);
  const isExpense = input.type === EntryType.EXPENSE;
  const paymentMethod = isExpense ? input.paymentMethod! : input.paymentMethod ?? PaymentMethod.OTHER;
  const frequencyProfile = isExpense
    ? input.frequencyProfile!
    : input.frequencyProfile ?? EntryFrequencyProfile.VARIABLE;
  const settlementStatus = isExpense
    ? resolveSettlementStatus(paymentMethod, input.settlementStatus!)
    : SettlementStatus.SETTLED;

  const [person, account, category] = await Promise.all([
    prisma.person.findFirst({ where: { id: input.personId, userId } }),
    prisma.financialAccount.findFirst({ where: { id: input.accountId, userId }, include: { institution: true } }),
    input.categoryId ? prisma.category.findFirst({ where: { id: input.categoryId, userId } }) : Promise.resolve(null),
  ]);
  const paymentMethodOption = await prisma.paymentMethodOption.findFirst({
    where: { userId, paymentMethod },
  });

  if (!person || !person.isActive) {
    throw new Error("A pessoa escolhida não está disponível para novos lançamentos.");
  }

  if (!account || !account.isActive) {
    throw new Error("A conta ou cartão escolhido não está disponível.");
  }

  if (input.type === EntryType.EXPENSE && !category) {
    throw new Error("Escolha uma categoria válida para a saída.");
  }

  if (input.type === EntryType.SAVED && !category) {
    throw new Error("Escolha um destino válido para o dinheiro guardado.");
  }

  if (category) {
    const categoryMatches =
      (input.type === EntryType.INCOME &&
        (category.type === CategoryType.INCOME || category.type === CategoryType.BOTH)) ||
      (input.type === EntryType.EXPENSE &&
        (category.type === CategoryType.EXPENSE || category.type === CategoryType.BOTH)) ||
      (input.type === EntryType.SAVED && category.type === CategoryType.INVESTMENT);

    if (!categoryMatches) {
      throw new Error("A categoria escolhida não combina com esse tipo de lançamento.");
    }

    if (!category.isActive) {
      throw new Error("A categoria escolhida está oculta e não pode ser usada agora.");
    }
  }

  if (isExpense && (!paymentMethodOption || !paymentMethodOption.isActive)) {
    throw new Error("A forma de pagamento escolhida está oculta ou não existe.");
  }

  if (
    paymentMethod === PaymentMethod.CREDIT_INSTALLMENT &&
    account.type !== AccountType.CREDIT_CARD &&
    account.type !== AccountType.MULTIPLE_CARD
  ) {
    throw new Error("Compras parceladas precisam de um cartão de crédito.");
  }

  if (
    (paymentMethod === PaymentMethod.CREDIT_SINGLE ||
      paymentMethod === PaymentMethod.CREDIT_INSTALLMENT) &&
    account.type === AccountType.CASH
  ) {
    throw new Error("Dinheiro não pode ser usado com pagamento no crédito.");
  }

  const creditBillingConfig =
    isExpense && isCreditCardPaymentMethod(paymentMethod) ? requireCreditCardBillingConfig(account) : null;
  const competenceDate = creditBillingConfig
    ? calculateCreditCardBillingDate({
        purchaseDate: eventDate,
        ...creditBillingConfig,
      }).competenceDate
    : startOfMonth(eventDate);

  if (!input.isInstallment) {
    const entry = await prisma.financialEntry.create({
      data: {
        description: input.description,
        userId,
        amount: input.amount,
        eventDate,
        competenceDate,
        type: input.type,
        personId: input.personId,
        accountId: input.accountId,
        categoryId: input.categoryId || null,
        paymentMethod,
        notes: input.notes || null,
        settlementStatus,
        frequencyProfile,
        isInstallment: false,
      },
    });

    return {
      kind: "single" as const,
      entryId: entry.id,
    };
  }

  const amounts = splitInstallments(input.amount, input.installmentCount);

  const purchase = await prisma.$transaction(async (tx) => {
    const installmentPurchase = await tx.installmentPurchase.create({
      data: {
        description: input.description,
        userId,
        totalAmount: input.amount,
        installmentCount: input.installmentCount,
        installmentAmount: amounts[0],
        purchaseDate: eventDate,
        notes: input.notes || null,
        personId: input.personId,
        accountId: input.accountId,
        categoryId: input.categoryId!,
      },
    });

    const installmentBillingConfig = creditBillingConfig ?? requireCreditCardBillingConfig(account);

    for (let index = 0; index < amounts.length; index += 1) {
      const installmentBilling = calculateCreditCardBillingDate({
        purchaseDate: eventDate,
        ...installmentBillingConfig,
        installmentOffset: index,
      });
      const entry = await tx.financialEntry.create({
        data: {
          description: input.description,
          userId,
          amount: amounts[index],
          eventDate,
          competenceDate: installmentBilling.competenceDate,
          type: EntryType.EXPENSE,
          personId: input.personId,
          accountId: input.accountId,
          categoryId: input.categoryId!,
          paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
          notes: input.notes || null,
          settlementStatus: SettlementStatus.PENDING,
          frequencyProfile,
          isInstallment: true,
          origin: EntryOrigin.INSTALLMENT_GENERATED,
        },
      });

      await tx.installment.create({
        data: {
          userId,
          installmentPurchaseId: installmentPurchase.id,
          financialEntryId: entry.id,
          number: index + 1,
          amount: amounts[index],
          dueDate: installmentBilling.dueDate,
          competenceDate: installmentBilling.competenceDate,
          status: InstallmentStatus.OPEN,
        },
      });
    }

    return installmentPurchase;
  });

  return {
    kind: "installment" as const,
    installmentPurchaseId: purchase.id,
  };
}
