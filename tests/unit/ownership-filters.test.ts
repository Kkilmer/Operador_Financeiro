import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntryFrequencyProfile, EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";

const requireCurrentUserId = vi.fn();
const findManyAccounts = vi.fn();
const findManyCategories = vi.fn();
const findManyPaymentMethods = vi.fn();
const findManyEntries = vi.fn();
const findManyInstallments = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUserId,
}));

vi.mock("@/lib/application/financial-entry/ensure-fixed-entries-for-month", () => ({
  ensureFixedEntriesForMonth: vi.fn(),
}));

vi.mock("@/lib/prisma/client", () => ({
  prisma: {
    financialAccount: { findMany: findManyAccounts },
    category: { findMany: findManyCategories },
    paymentMethodOption: { findMany: findManyPaymentMethods },
    financialEntry: { findMany: findManyEntries },
    installment: { findMany: findManyInstallments },
  },
}));

describe("ownership filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCurrentUserId.mockResolvedValue("user-123");
    findManyAccounts.mockResolvedValue([]);
    findManyCategories.mockResolvedValue([]);
    findManyPaymentMethods.mockResolvedValue([]);
    findManyEntries.mockResolvedValue([]);
    findManyInstallments.mockResolvedValue([]);
  });

  it("filtra contas pelo userId atual", async () => {
    const { listAccounts } = await import("@/features/configuracoes/services/list-accounts");

    await listAccounts();

    expect(findManyAccounts).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-123" }),
      }),
    );
  });

  it("filtra categorias pelo userId atual", async () => {
    const { listCategories } = await import("@/features/configuracoes/services/list-categories");

    await listCategories();

    expect(findManyCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-123" }),
      }),
    );
  });

  it("filtra formas de pagamento pelo userId atual", async () => {
    const { listPaymentMethodOptions } = await import("@/features/configuracoes/services/list-payment-method-options");

    await listPaymentMethodOptions();

    expect(findManyPaymentMethods).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-123" }),
      }),
    );
  });

  it("filtra lançamentos pelo userId atual", async () => {
    const { listFinancialEntries } = await import("@/features/lancamentos/services/list-financial-entries");

    await listFinancialEntries("2026-05");

    expect(findManyEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-123", deletedAt: null }),
      }),
    );
  });

  it("aplica filtros de lançamentos sem remover userId e deletedAt", async () => {
    const { listFinancialEntries } = await import("@/features/lancamentos/services/list-financial-entries");

    await listFinancialEntries("2026-05", {
      settlementStatus: SettlementStatus.PENDING,
      type: EntryType.EXPENSE,
      recurrence: EntryFrequencyProfile.FIXED,
      isInstallment: true,
      accountId: "account-1",
      paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
      categoryId: "category-1",
      personId: "person-1",
    });

    expect(findManyEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-123",
          deletedAt: null,
          settlementStatus: SettlementStatus.PENDING,
          type: EntryType.EXPENSE,
          frequencyProfile: EntryFrequencyProfile.FIXED,
          isInstallment: true,
          accountId: "account-1",
          paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
          categoryId: "category-1",
          personId: "person-1",
        }),
      }),
    );
  });

  it("filtra parcelas pelo userId atual e ignora lançamentos removidos", async () => {
    const { listInstallmentCommitments } = await import("@/features/parcelas/services/list-installment-commitments");

    await listInstallmentCommitments({ month: "2026-05" });

    expect(findManyInstallments).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-123",
          financialEntry: expect.objectContaining({
            userId: "user-123",
            deletedAt: null,
          }),
        }),
      }),
    );
  });
});
