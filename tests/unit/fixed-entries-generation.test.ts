import {
  EntryFrequencyProfile,
  EntryOrigin,
  EntryType,
  PaymentMethod,
  SettlementStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireCurrentUserId = vi.fn();
const findManyEntries = vi.fn();
const createEntry = vi.fn();
const updateManyEntries = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUserId,
}));

vi.mock("@/lib/prisma/client", () => ({
  prisma: {
    financialEntry: {
      findMany: findManyEntries,
      create: createEntry,
      updateMany: updateManyEntries,
    },
  },
}));

const fixedTemplate = {
  description: "Internet Fibra",
  amount: 99.9,
  eventDate: new Date(2026, 3, 10),
  competenceDate: new Date(2026, 3, 1),
  personId: "person-1",
  accountId: "account-1",
  categoryId: "category-1",
  paymentMethod: PaymentMethod.BOLETO,
  notes: null,
};

const targetOccurrence = {
  id: "entry-target",
  description: "Internet ajustada em maio",
  personId: "person-1",
  accountId: "account-1",
  categoryId: "category-1",
  paymentMethod: PaymentMethod.BOLETO,
  type: EntryType.EXPENSE,
  competenceDate: new Date(2026, 4, 1),
  origin: EntryOrigin.RECURRING_GENERATED,
  frequencyProfile: EntryFrequencyProfile.FIXED,
  settlementStatus: SettlementStatus.PENDING,
  createdAt: new Date(2026, 4, 1),
  updatedAt: new Date(2026, 4, 2),
  deletedAt: null,
};

describe("ensureFixedEntriesForMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCurrentUserId.mockResolvedValue("user-1");
    createEntry.mockResolvedValue({ id: "generated-entry" });
    updateManyEntries.mockResolvedValue({ count: 0 });
  });

  it("gera gasto fixo futuro como pendente", async () => {
    findManyEntries.mockResolvedValueOnce([fixedTemplate]).mockResolvedValueOnce([]);

    const { ensureFixedEntriesForMonth } = await import(
      "@/lib/application/financial-entry/ensure-fixed-entries-for-month"
    );

    await ensureFixedEntriesForMonth("2026-05");

    expect(createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          settlementStatus: SettlementStatus.PENDING,
          origin: EntryOrigin.RECURRING_GENERATED,
          competenceDate: new Date(2026, 4, 1),
        }),
      }),
    );
  });

  it("não duplica ao abrir o mesmo mês com ocorrência estrutural equivalente", async () => {
    findManyEntries.mockResolvedValueOnce([fixedTemplate]).mockResolvedValueOnce([targetOccurrence]);

    const { ensureFixedEntriesForMonth } = await import(
      "@/lib/application/financial-entry/ensure-fixed-entries-for-month"
    );

    await ensureFixedEntriesForMonth("2026-05");

    expect(createEntry).not.toHaveBeenCalled();
  });

  it("não recria no mesmo mês um gasto fixo removido por soft delete", async () => {
    findManyEntries
      .mockResolvedValueOnce([fixedTemplate])
      .mockResolvedValueOnce([{ ...targetOccurrence, deletedAt: new Date(2026, 4, 12) }]);

    const { ensureFixedEntriesForMonth } = await import(
      "@/lib/application/financial-entry/ensure-fixed-entries-for-month"
    );

    await ensureFixedEntriesForMonth("2026-05");

    expect(createEntry).not.toHaveBeenCalled();
  });
});
