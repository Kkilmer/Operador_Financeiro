import {
  AccountType,
  CategoryType,
  EntryFrequencyProfile,
  EntryType,
  PaymentMethod,
  SettlementStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireCurrentUserId = vi.fn();
const findPerson = vi.fn();
const findAccount = vi.fn();
const findCategory = vi.fn();
const findPaymentMethod = vi.fn();
const financialEntryCreate = vi.fn();
const txInstallmentPurchaseCreate = vi.fn();
const txFinancialEntryCreate = vi.fn();
const txInstallmentCreate = vi.fn();
const transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
  callback({
    installmentPurchase: { create: txInstallmentPurchaseCreate },
    financialEntry: { create: txFinancialEntryCreate },
    installment: { create: txInstallmentCreate },
  }),
);

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUserId,
}));

vi.mock("@/lib/prisma/client", () => ({
  prisma: {
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
    financialEntry: {
      create: financialEntryCreate,
    },
    $transaction: transaction,
  },
}));

describe("createFinancialEntryUseCase credit card billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCurrentUserId.mockResolvedValue("user-1");
    findPerson.mockResolvedValue({ id: "person-1", isActive: true });
    findAccount.mockResolvedValue({
      id: "account-1",
      isActive: true,
      type: AccountType.CREDIT_CARD,
      closingDay: 29,
      dueDay: 5,
    });
    findCategory.mockResolvedValue({ id: "category-1", isActive: true, type: CategoryType.EXPENSE });
    findPaymentMethod.mockResolvedValue({ id: "payment-1", isActive: true });
    financialEntryCreate.mockResolvedValue({ id: "entry-1" });
    txInstallmentPurchaseCreate.mockResolvedValue({ id: "purchase-1" });
    txFinancialEntryCreate.mockImplementation(async () => ({ id: `entry-${txFinancialEntryCreate.mock.calls.length}` }));
    txInstallmentCreate.mockResolvedValue({ id: "installment-1" });
  });

  it("usa a competência da fatura para crédito à vista e mantém a data real da compra", async () => {
    const { createFinancialEntryUseCase } = await import(
      "@/lib/application/financial-entry/create-financial-entry.use-case"
    );

    await createFinancialEntryUseCase({
      description: "Compra no crédito",
      amount: 100,
      eventDate: "2026-05-30",
      type: EntryType.EXPENSE,
      personId: "person-1",
      accountId: "account-1",
      categoryId: "category-1",
      paymentMethod: PaymentMethod.CREDIT_SINGLE,
      notes: "",
      settlementStatus: SettlementStatus.PENDING,
      frequencyProfile: EntryFrequencyProfile.VARIABLE,
      isInstallment: false,
      installmentCount: 0,
    });

    expect(financialEntryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventDate: new Date(2026, 4, 30),
          competenceDate: new Date(2026, 6, 1),
        }),
      }),
    );
  });

  it("mantém Pix no mês da própria compra", async () => {
    findAccount.mockResolvedValueOnce({
      id: "account-1",
      isActive: true,
      type: AccountType.CHECKING,
      closingDay: null,
      dueDay: null,
    });
    const { createFinancialEntryUseCase } = await import(
      "@/lib/application/financial-entry/create-financial-entry.use-case"
    );

    await createFinancialEntryUseCase({
      description: "Compra no Pix",
      amount: 100,
      eventDate: "2026-05-30",
      type: EntryType.EXPENSE,
      personId: "person-1",
      accountId: "account-1",
      categoryId: "category-1",
      paymentMethod: PaymentMethod.PIX,
      notes: "",
      settlementStatus: SettlementStatus.PENDING,
      frequencyProfile: EntryFrequencyProfile.VARIABLE,
      isInstallment: false,
      installmentCount: 0,
    });

    expect(financialEntryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventDate: new Date(2026, 4, 30),
          competenceDate: new Date(2026, 4, 1),
          settlementStatus: SettlementStatus.SETTLED,
        }),
      }),
    );
  });

  it("gera compra parcelada a partir da primeira fatura correta", async () => {
    const { createFinancialEntryUseCase } = await import(
      "@/lib/application/financial-entry/create-financial-entry.use-case"
    );

    await createFinancialEntryUseCase({
      description: "Compra parcelada",
      amount: 300,
      eventDate: "2026-05-30",
      type: EntryType.EXPENSE,
      personId: "person-1",
      accountId: "account-1",
      categoryId: "category-1",
      paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
      notes: "",
      settlementStatus: SettlementStatus.PENDING,
      frequencyProfile: EntryFrequencyProfile.VARIABLE,
      isInstallment: true,
      installmentCount: 3,
    });

    const entryDates = txFinancialEntryCreate.mock.calls.map((call) => ({
      eventDate: call[0].data.eventDate,
      competenceDate: call[0].data.competenceDate,
    }));
    const installmentDates = txInstallmentCreate.mock.calls.map((call) => ({
      dueDate: call[0].data.dueDate,
      competenceDate: call[0].data.competenceDate,
    }));

    expect(entryDates).toEqual([
      { eventDate: new Date(2026, 4, 30), competenceDate: new Date(2026, 6, 1) },
      { eventDate: new Date(2026, 4, 30), competenceDate: new Date(2026, 7, 1) },
      { eventDate: new Date(2026, 4, 30), competenceDate: new Date(2026, 8, 1) },
    ]);
    expect(installmentDates).toEqual([
      { dueDate: new Date(2026, 6, 5), competenceDate: new Date(2026, 6, 1) },
      { dueDate: new Date(2026, 7, 5), competenceDate: new Date(2026, 7, 1) },
      { dueDate: new Date(2026, 8, 5), competenceDate: new Date(2026, 8, 1) },
    ]);
  });
});
