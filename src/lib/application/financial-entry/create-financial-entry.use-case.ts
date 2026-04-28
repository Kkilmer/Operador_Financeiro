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

import { prisma } from "@/lib/prisma/client";
import { addMonths, normalizeDateInput, startOfMonth } from "@/lib/utils/date";
import { CreateFinancialEntryInput } from "@/features/lancamentos/schemas/create-financial-entry-schema";

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
  const eventDate = normalizeDateInput(input.eventDate);
  const competenceDate = startOfMonth(eventDate);
  const paymentMethod =
    input.type === EntryType.INCOME ? input.paymentMethod ?? PaymentMethod.OTHER : input.paymentMethod!;
  const frequencyProfile =
    input.type === EntryType.INCOME
      ? input.frequencyProfile ?? EntryFrequencyProfile.VARIABLE
      : input.frequencyProfile!;
  const settlementStatus =
    input.type === EntryType.INCOME
      ? SettlementStatus.SETTLED
      : resolveSettlementStatus(paymentMethod, input.settlementStatus!);

  const [person, account, category] = await Promise.all([
    prisma.person.findUnique({ where: { id: input.personId } }),
    prisma.financialAccount.findUnique({ where: { id: input.accountId }, include: { institution: true } }),
    input.categoryId ? prisma.category.findUnique({ where: { id: input.categoryId } }) : Promise.resolve(null),
  ]);
  const paymentMethodOption = await prisma.paymentMethodOption.findUnique({
    where: { paymentMethod },
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

  if (category) {
    const expectedCategoryType =
      input.type === EntryType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;

    if (category.type !== expectedCategoryType && category.type !== CategoryType.BOTH) {
      throw new Error("A categoria escolhida não combina com esse tipo de lançamento.");
    }

    if (!category.isActive) {
      throw new Error("A categoria escolhida está oculta e não pode ser usada agora.");
    }
  }

  if (input.type === EntryType.EXPENSE && (!paymentMethodOption || !paymentMethodOption.isActive)) {
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

  if (!input.isInstallment) {
    const entry = await prisma.financialEntry.create({
      data: {
        description: input.description,
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

    for (let index = 0; index < amounts.length; index += 1) {
      const installmentDate = addMonths(eventDate, index);
      const installmentCompetence = startOfMonth(installmentDate);
      const entry = await tx.financialEntry.create({
        data: {
          description: `${input.description} (${index + 1}/${input.installmentCount})`,
          amount: amounts[index],
          eventDate: installmentDate,
          competenceDate: installmentCompetence,
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
          installmentPurchaseId: installmentPurchase.id,
          financialEntryId: entry.id,
          number: index + 1,
          amount: amounts[index],
          dueDate: installmentDate,
          competenceDate: installmentCompetence,
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
