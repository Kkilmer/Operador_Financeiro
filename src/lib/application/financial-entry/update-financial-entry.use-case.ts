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
import { UpdateFinancialEntryInput } from "@/features/lancamentos/schemas/update-financial-entry-schema";
import {
  calculateCreditCardBillingDate,
  isCreditCardPaymentMethod,
  requireCreditCardBillingConfig,
} from "@/lib/application/financial-entry/credit-card-billing";
import {
  buildInstallmentSequenceReorderPlan,
  InstallmentSequenceOverflowError,
} from "@/lib/application/financial-entry/reorder-installment-sequence";

export class InstallmentPurchaseAdjustmentRequiredError extends Error {
  adjustment: {
    currentTotalAmount: number;
    currentTotalInstallments: number;
    requestedInstallmentNumber: number;
    suggestedTotalInstallments: number;
    nextInstallmentNumber: number | null;
  };

  constructor(adjustment: InstallmentPurchaseAdjustmentRequiredError["adjustment"]) {
    super("Essa alteração ultrapassa o total atual da compra parcelada.");
    this.name = "InstallmentPurchaseAdjustmentRequiredError";
    this.adjustment = adjustment;
  }
}

export async function updateFinancialEntryUseCase(input: UpdateFinancialEntryInput) {
  const userId = await requireCurrentUserId();
  const existingEntry = await prisma.financialEntry.findFirst({
    where: {
      id: input.id,
      userId,
      deletedAt: null,
    },
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
    prisma.person.findFirst({ where: { id: input.personId, userId } }),
    prisma.financialAccount.findFirst({ where: { id: input.accountId, userId } }),
    input.categoryId ? prisma.category.findFirst({ where: { id: input.categoryId, userId } }) : Promise.resolve(null),
    prisma.paymentMethodOption.findFirst({ where: { userId, paymentMethod } }),
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

  const creditBillingConfig =
    isExpense && isCreditCardPaymentMethod(paymentMethod) ? requireCreditCardBillingConfig(account) : null;
  const installmentNumber = isInstallmentEntry ? input.installmentNumber ?? existingEntry.installment?.number ?? 1 : 1;
  const creditBilling = creditBillingConfig
    ? calculateCreditCardBillingDate({
        purchaseDate: eventDate,
        ...creditBillingConfig,
        installmentOffset: isInstallmentEntry ? installmentNumber - 1 : 0,
      })
    : null;
  const competenceDate = creditBilling?.competenceDate ?? startOfMonth(eventDate);
  const dueDate = creditBilling?.dueDate ?? eventDate;

  if (isInstallmentEntry) {
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
          amount: input.amount,
          dueDate,
          competenceDate,
          status:
            settlementStatus === SettlementStatus.SETTLED
              ? InstallmentStatus.SETTLED
              : InstallmentStatus.OPEN,
        },
      });

      if (
        input.installmentNumber &&
        existingEntry.installment &&
        input.installmentNumber !== existingEntry.installment.number
      ) {
        const purchaseInstallments = await tx.installment.findMany({
          where: {
            userId,
            installmentPurchaseId: existingEntry.installment.installmentPurchaseId,
          },
          include: {
            financialEntry: {
              select: {
                deletedAt: true,
                settlementStatus: true,
              },
            },
          },
        });
        const installmentSequenceItems = purchaseInstallments.map((installment) => ({
            id: installment.id,
            number: installment.number,
            dueDate: installment.dueDate,
            competenceDate: installment.competenceDate,
            createdAt: installment.createdAt,
            isSettled:
              installment.status === InstallmentStatus.SETTLED ||
              installment.financialEntry.settlementStatus === SettlementStatus.SETTLED,
            isDeleted: Boolean(installment.financialEntry.deletedAt),
          }));
        const totalInstallments =
          input.adjustInstallmentPurchase && input.installmentPurchaseInstallmentCount
            ? input.installmentPurchaseInstallmentCount
            : existingEntry.installment.installmentPurchase.installmentCount;
        let reorderPlan: ReturnType<typeof buildInstallmentSequenceReorderPlan>;

        try {
          reorderPlan = buildInstallmentSequenceReorderPlan({
            installments: installmentSequenceItems,
            currentInstallmentId: existingEntry.installment.id,
            requestedNumber: input.installmentNumber,
            totalInstallments,
          });
        } catch (error) {
          if (error instanceof InstallmentSequenceOverflowError && !input.adjustInstallmentPurchase) {
            throw new InstallmentPurchaseAdjustmentRequiredError({
              currentTotalAmount: Number(existingEntry.installment.installmentPurchase.totalAmount),
              currentTotalInstallments: existingEntry.installment.installmentPurchase.installmentCount,
              requestedInstallmentNumber: input.installmentNumber,
              suggestedTotalInstallments: error.requiredTotalInstallments,
              nextInstallmentNumber:
                error.requiredTotalInstallments > input.installmentNumber
                  ? input.installmentNumber + 1
                  : null,
            });
          }

          throw error;
        }

        if (input.adjustInstallmentPurchase) {
          await tx.installmentPurchase.update({
            where: { id: existingEntry.installment.installmentPurchaseId },
            data: {
              totalAmount:
                input.installmentPurchaseTotalAmount ??
                Number(existingEntry.installment.installmentPurchase.totalAmount),
              installmentCount: totalInstallments,
              installmentAmount:
                (input.installmentPurchaseTotalAmount ??
                  Number(existingEntry.installment.installmentPurchase.totalAmount)) / totalInstallments,
            },
          });
        }

        for (const update of reorderPlan.temporaryUpdates) {
          await tx.installment.update({
            where: { id: update.id },
            data: { number: update.number },
          });
        }

        for (const update of reorderPlan.finalUpdates) {
          await tx.installment.update({
            where: { id: update.id },
            data: { number: update.number },
          });
        }
      }
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
