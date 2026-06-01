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
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireCurrentUserId = vi.fn();
const findEntry = vi.fn();
const findPerson = vi.fn();
const findAccount = vi.fn();
const findCategory = vi.fn();
const findPaymentMethod = vi.fn();
const txEntryUpdate = vi.fn();
const txInstallmentUpdate = vi.fn();
const txInstallmentFindMany = vi.fn();
const txInstallmentPurchaseUpdate = vi.fn();
const transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
  callback({
    financialEntry: { update: txEntryUpdate },
    installment: { update: txInstallmentUpdate, findMany: txInstallmentFindMany },
    installmentPurchase: { update: txInstallmentPurchaseUpdate },
  }),
);

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUserId,
}));

vi.mock("@/lib/prisma/client", () => ({
  prisma: {
    financialEntry: {
      findFirst: findEntry,
    },
    person: {
      findFirst: findPerson,
    },
    financialAccount: {
      findFirst: findAccount,
    },
    category: {
      findFirst: findCategory,
    },
    paymentMethodOption: {
      findFirst: findPaymentMethod,
    },
    $transaction: transaction,
  },
}));

describe("updateFinancialEntryUseCase for installments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCurrentUserId.mockResolvedValue("user-1");
    findEntry.mockResolvedValue({
      id: "entry-4",
      userId: "user-1",
      origin: EntryOrigin.INSTALLMENT_GENERATED,
      installment: {
        id: "installment-4",
        installmentPurchaseId: "purchase-1",
        number: 4,
        installmentPurchase: {
          totalAmount: 500,
          installmentCount: 5,
        },
      },
    });
    findPerson.mockResolvedValue({ id: "person-1", isActive: true });
    findAccount.mockResolvedValue({ id: "account-1", isActive: true, type: AccountType.CREDIT_CARD });
    findCategory.mockResolvedValue({ id: "category-1", isActive: true, type: CategoryType.EXPENSE });
    findPaymentMethod.mockResolvedValue({ id: "payment-1", isActive: true });
    txInstallmentFindMany.mockResolvedValue([]);
  });

  it("edita somente a parcela atual e não altera o número persistido", async () => {
    const { updateFinancialEntryUseCase } = await import(
      "@/lib/application/financial-entry/update-financial-entry.use-case"
    );

    await updateFinancialEntryUseCase({
      id: "entry-4",
      description: "Descrição livre ajustada em maio",
      amount: 123.45,
      eventDate: "2026-05-04",
      type: EntryType.EXPENSE,
      personId: "person-1",
      accountId: "account-1",
      categoryId: "category-1",
      paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
      notes: "Ajuste manual da parcela",
      settlementStatus: SettlementStatus.PENDING,
      frequencyProfile: EntryFrequencyProfile.VARIABLE,
      isInstallment: false,
      installmentCount: 0,
      isInstallmentEntry: true,
    });

    expect(txEntryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "entry-4" },
        data: expect.objectContaining({
          description: "Descrição livre ajustada em maio",
          competenceDate: new Date(2026, 4, 1),
        }),
      }),
    );

    const installmentUpdateData = txInstallmentUpdate.mock.calls[0][0].data;
    expect(installmentUpdateData).toMatchObject({
      amount: 123.45,
      competenceDate: new Date(2026, 4, 1),
    });
    expect(installmentUpdateData).not.toHaveProperty("number");
  });

  it("reordena parcelas futuras em aberto quando o número da parcela atual muda", async () => {
    const baseDate = (month: number) => new Date(2026, month - 1, 5);
    findEntry.mockResolvedValueOnce({
      id: "entry-3",
      userId: "user-1",
      origin: EntryOrigin.INSTALLMENT_GENERATED,
      installment: {
        id: "installment-3",
        installmentPurchaseId: "purchase-10x",
        number: 3,
        installmentPurchase: {
          totalAmount: 1000,
          installmentCount: 10,
        },
      },
    });
    txInstallmentFindMany.mockResolvedValueOnce([
      {
        id: "installment-1",
        number: 1,
        dueDate: baseDate(1),
        competenceDate: new Date(2026, 0, 1),
        createdAt: baseDate(1),
        status: InstallmentStatus.OPEN,
        financialEntry: { settlementStatus: SettlementStatus.PENDING, deletedAt: null },
      },
      {
        id: "installment-2",
        number: 2,
        dueDate: baseDate(2),
        competenceDate: new Date(2026, 1, 1),
        createdAt: baseDate(2),
        status: InstallmentStatus.OPEN,
        financialEntry: { settlementStatus: SettlementStatus.PENDING, deletedAt: null },
      },
      ...[3, 4, 5, 6, 7, 8].map((number) => ({
        id: `installment-${number}`,
        number,
        dueDate: baseDate(number),
        competenceDate: new Date(2026, number - 1, 1),
        createdAt: baseDate(number),
        status: InstallmentStatus.OPEN,
        financialEntry: { settlementStatus: SettlementStatus.PENDING, deletedAt: null },
      })),
    ]);
    const { updateFinancialEntryUseCase } = await import(
      "@/lib/application/financial-entry/update-financial-entry.use-case"
    );

    await updateFinancialEntryUseCase({
      id: "entry-3",
      description: "Compra ajustada",
      amount: 100,
      eventDate: "2026-03-05",
      type: EntryType.EXPENSE,
      personId: "person-1",
      accountId: "account-1",
      categoryId: "category-1",
      paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
      notes: "",
      settlementStatus: SettlementStatus.PENDING,
      frequencyProfile: EntryFrequencyProfile.VARIABLE,
      isInstallment: false,
      installmentCount: 0,
      isInstallmentEntry: true,
      installmentNumber: 5,
    });

    const finalNumberUpdates = txInstallmentUpdate.mock.calls
      .map((call) => call[0])
      .filter((call) => typeof call.data.number === "number" && call.data.number > 0)
      .map((call) => ({ id: call.where.id, number: call.data.number }));

    expect(finalNumberUpdates).toEqual([
      { id: "installment-3", number: 5 },
      { id: "installment-4", number: 6 },
      { id: "installment-5", number: 7 },
      { id: "installment-6", number: 8 },
      { id: "installment-7", number: 9 },
      { id: "installment-8", number: 10 },
    ]);
  });

  it("pede ajuste da compra quando a sequência ultrapassa o total atual", async () => {
    const baseDate = (month: number) => new Date(2026, month - 1, 5);
    findEntry.mockResolvedValueOnce({
      id: "entry-3",
      userId: "user-1",
      origin: EntryOrigin.INSTALLMENT_GENERATED,
      installment: {
        id: "installment-3",
        installmentPurchaseId: "purchase-10x",
        number: 3,
        installmentPurchase: {
          totalAmount: 1000,
          installmentCount: 10,
        },
      },
    });
    txInstallmentFindMany.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, index) => {
        const number = index + 1;

        return {
          id: `installment-${number}`,
          number,
          dueDate: baseDate(number),
          competenceDate: new Date(2026, number - 1, 1),
          createdAt: baseDate(number),
          status: InstallmentStatus.OPEN,
          financialEntry: { settlementStatus: SettlementStatus.PENDING, deletedAt: null },
        };
      }),
    );
    const {
      InstallmentPurchaseAdjustmentRequiredError,
      updateFinancialEntryUseCase,
    } = await import("@/lib/application/financial-entry/update-financial-entry.use-case");

    await expect(
      updateFinancialEntryUseCase({
        id: "entry-3",
        description: "Compra ajustada",
        amount: 100,
        eventDate: "2026-03-05",
        type: EntryType.EXPENSE,
        personId: "person-1",
        accountId: "account-1",
        categoryId: "category-1",
        paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
        notes: "",
        settlementStatus: SettlementStatus.PENDING,
        frequencyProfile: EntryFrequencyProfile.VARIABLE,
        isInstallment: false,
        installmentCount: 0,
        isInstallmentEntry: true,
        installmentNumber: 5,
      }),
    ).rejects.toBeInstanceOf(InstallmentPurchaseAdjustmentRequiredError);
  });

  it("atualiza a compra parcelada e aplica a sequência quando o ajuste é confirmado", async () => {
    const baseDate = (month: number) => new Date(2026, month - 1, 5);
    findEntry.mockResolvedValueOnce({
      id: "entry-3",
      userId: "user-1",
      origin: EntryOrigin.INSTALLMENT_GENERATED,
      installment: {
        id: "installment-3",
        installmentPurchaseId: "purchase-10x",
        number: 3,
        installmentPurchase: {
          totalAmount: 1000,
          installmentCount: 10,
        },
      },
    });
    txInstallmentFindMany.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, index) => {
        const number = index + 1;

        return {
          id: `installment-${number}`,
          number,
          dueDate: baseDate(number),
          competenceDate: new Date(2026, number - 1, 1),
          createdAt: baseDate(number),
          status: InstallmentStatus.OPEN,
          financialEntry: { settlementStatus: SettlementStatus.PENDING, deletedAt: null },
        };
      }),
    );
    const { updateFinancialEntryUseCase } = await import(
      "@/lib/application/financial-entry/update-financial-entry.use-case"
    );

    await updateFinancialEntryUseCase({
      id: "entry-3",
      description: "Compra ajustada",
      amount: 100,
      eventDate: "2026-03-05",
      type: EntryType.EXPENSE,
      personId: "person-1",
      accountId: "account-1",
      categoryId: "category-1",
      paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
      notes: "",
      settlementStatus: SettlementStatus.PENDING,
      frequencyProfile: EntryFrequencyProfile.VARIABLE,
      isInstallment: false,
      installmentCount: 0,
      isInstallmentEntry: true,
      installmentNumber: 5,
      adjustInstallmentPurchase: true,
      installmentPurchaseTotalAmount: 1200,
      installmentPurchaseInstallmentCount: 12,
    });

    expect(txInstallmentPurchaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "purchase-10x" },
        data: expect.objectContaining({
          totalAmount: 1200,
          installmentCount: 12,
          installmentAmount: 100,
        }),
      }),
    );

    const finalNumberUpdates = txInstallmentUpdate.mock.calls
      .map((call) => call[0])
      .filter((call) => typeof call.data.number === "number" && call.data.number > 0)
      .map((call) => ({ id: call.where.id, number: call.data.number }));

    expect(finalNumberUpdates.at(0)).toEqual({ id: "installment-3", number: 5 });
    expect(finalNumberUpdates.at(1)).toEqual({ id: "installment-4", number: 6 });
    expect(finalNumberUpdates.at(-1)).toEqual({ id: "installment-10", number: 12 });
  });
});
