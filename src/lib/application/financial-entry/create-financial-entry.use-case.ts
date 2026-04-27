import {
  AccountType,
  CategoryType,
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
  const settlementStatus = resolveSettlementStatus(input.paymentMethod, input.settlementStatus);

  const [person, account, category] = await Promise.all([
    prisma.person.findUnique({ where: { id: input.personId } }),
    prisma.financialAccount.findUnique({ where: { id: input.accountId }, include: { institution: true } }),
    input.categoryId ? prisma.category.findUnique({ where: { id: input.categoryId } }) : Promise.resolve(null),
  ]);
  const paymentMethodOption = await prisma.paymentMethodOption.findUnique({
    where: { paymentMethod: input.paymentMethod },
  });

  if (!person || !person.isActive) {
    throw new Error("A pessoa selecionada nao esta disponivel para novos lancamentos.");
  }

  if (!account || !account.isActive) {
    throw new Error("A conta ou cartao selecionado nao esta disponivel.");
  }

  if (input.type === EntryType.EXPENSE && !category) {
    throw new Error("Selecione uma categoria valida para a saida.");
  }

  if (category) {
    const expectedCategoryType =
      input.type === EntryType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;

    if (category.type !== expectedCategoryType && category.type !== CategoryType.BOTH) {
      throw new Error("A categoria selecionada nao combina com o tipo do lancamento.");
    }

    if (!category.isActive) {
      throw new Error("A categoria selecionada esta inativa.");
    }
  }

  if (!paymentMethodOption || !paymentMethodOption.isActive) {
    throw new Error("A forma de pagamento selecionada esta inativa ou nao existe.");
  }

  if (
    input.paymentMethod === PaymentMethod.CREDIT_INSTALLMENT &&
    account.type !== AccountType.CREDIT_CARD &&
    account.type !== AccountType.MULTIPLE_CARD
  ) {
    throw new Error("Compras parceladas exigem uma conta do tipo cartao de credito.");
  }

  if (
    (input.paymentMethod === PaymentMethod.CREDIT_SINGLE ||
      input.paymentMethod === PaymentMethod.CREDIT_INSTALLMENT) &&
    account.type === AccountType.CASH
  ) {
    throw new Error("Dinheiro nao pode ser usado com pagamento em credito.");
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
        paymentMethod: input.paymentMethod,
        notes: input.notes || null,
        settlementStatus,
        frequencyProfile: input.frequencyProfile,
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
          frequencyProfile: input.frequencyProfile,
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
