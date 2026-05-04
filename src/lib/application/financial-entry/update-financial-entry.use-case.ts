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
import { normalizeDateInput, startOfMonth } from "@/lib/utils/date";
import { UpdateFinancialEntryInput } from "@/features/lancamentos/schemas/update-financial-entry-schema";

function parseInstallmentLabel(description: string) {
  const match = description.match(/\((\d+)\/(\d+)\)\s*$/);

  if (!match) {
    return null;
  }

  return {
    number: Number(match[1]),
    total: Number(match[2]),
  };
}

export async function updateFinancialEntryUseCase(input: UpdateFinancialEntryInput) {
  const existingEntry = await prisma.financialEntry.findUnique({
    where: { id: input.id },
    include: {
      installment: {
        include: {
          installmentPurchase: true,
        },
      },
    },
  });

  if (!existingEntry) {
    throw new Error("Esse lançamento não foi encontrado.");
  }

  const isInstallmentEntry = Boolean(existingEntry.installment);
  const eventDate = normalizeDateInput(input.eventDate);
  const competenceDate = startOfMonth(eventDate);
  const isExpense = input.type === EntryType.EXPENSE;
  const paymentMethod = isExpense ? input.paymentMethod! : input.paymentMethod ?? PaymentMethod.OTHER;
  const frequencyProfile = isExpense
    ? input.frequencyProfile ?? EntryFrequencyProfile.VARIABLE
    : EntryFrequencyProfile.VARIABLE;
  const settlementStatus = isExpense
    ? input.settlementStatus ?? SettlementStatus.PENDING
    : SettlementStatus.SETTLED;
  const nextOrigin =
    existingEntry.origin === EntryOrigin.RECURRING_GENERATED ? EntryOrigin.MANUAL : existingEntry.origin;

  const [person, account, category, paymentMethodOption] = await Promise.all([
    prisma.person.findUnique({ where: { id: input.personId } }),
    prisma.financialAccount.findUnique({ where: { id: input.accountId } }),
    input.categoryId ? prisma.category.findUnique({ where: { id: input.categoryId } }) : Promise.resolve(null),
    prisma.paymentMethodOption.findUnique({ where: { paymentMethod } }),
  ]);

  if (!person || !person.isActive) {
    throw new Error("A pessoa escolhida não está disponível.");
  }

  if (!account || !account.isActive) {
    throw new Error("A conta ou cartão escolhido não está disponível.");
  }

  if (!category) {
    throw new Error("Escolha uma categoria válida.");
  }

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

  if (isInstallmentEntry) {
    const parsedInstallment = parseInstallmentLabel(input.description);

    if (parsedInstallment) {
      const existingInstallmentCount = existingEntry.installment?.installmentPurchase.installmentCount;

      if (!existingInstallmentCount || parsedInstallment.total !== existingInstallmentCount) {
        throw new Error(
          `Para manter a compra parcelada consistente, o total desta parcela precisa continuar ${existingInstallmentCount ?? "o mesmo da compra"}.`,
        );
      }

      if (parsedInstallment.number < 1 || parsedInstallment.number > existingInstallmentCount) {
        throw new Error(`O número da parcela precisa ficar entre 1 e ${existingInstallmentCount}.`);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.financialEntry.update({
        where: { id: input.id },
        data: {
          description: input.description,
          amount: input.amount,
          eventDate,
          competenceDate,
          settlementStatus,
          notes: input.notes || null,
          categoryId: input.categoryId,
          origin: nextOrigin,
        },
      });

      await tx.installment.update({
        where: { financialEntryId: input.id },
        data: {
          number: parsedInstallment?.number,
          amount: input.amount,
          dueDate: eventDate,
          competenceDate,
          status:
            settlementStatus === SettlementStatus.SETTLED
              ? InstallmentStatus.SETTLED
              : InstallmentStatus.OPEN,
        },
      });
    });

    return {
      kind: "installment" as const,
      entryId: input.id,
    };
  }

  await prisma.financialEntry.update({
    where: { id: input.id },
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
      settlementStatus,
      frequencyProfile,
      notes: input.notes || null,
      origin: nextOrigin,
    },
  });

  return {
    kind: "single" as const,
    entryId: input.id,
  };
}
