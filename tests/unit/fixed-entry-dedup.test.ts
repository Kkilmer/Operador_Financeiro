import { EntryType, PaymentMethod } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  getStrictFixedEntryKey,
  getStructuralFixedEntryKey,
  shouldGenerateFixedEntry,
} from "@/lib/application/financial-entry/fixed-entry-dedup";

const referenceMonth = new Date(2026, 4, 1);

describe("fixed entry deduplication", () => {
  it("gera chaves estrita e estrutural de forma estável", () => {
    const strictKey = getStrictFixedEntryKey({
      description: "Internet Fibra",
      personId: "person-1",
      accountId: "account-1",
      categoryId: "category-1",
      paymentMethod: PaymentMethod.BOLETO,
      type: EntryType.EXPENSE,
      competenceDate: referenceMonth,
    });

    const structuralKey = getStructuralFixedEntryKey({
      personId: "person-1",
      accountId: "account-1",
      categoryId: "category-1",
      paymentMethod: PaymentMethod.BOLETO,
      type: EntryType.EXPENSE,
      competenceDate: referenceMonth,
    });

    expect(strictKey).toContain("internet fibra");
    expect(structuralKey).not.toContain("internet fibra");
  });

  it("não gera duplicado quando já existe a mesma ocorrência exata no mês", () => {
    const shouldGenerate = shouldGenerateFixedEntry({
      template: {
        description: "Internet Fibra",
        personId: "person-1",
        accountId: "account-1",
        categoryId: "category-1",
        paymentMethod: PaymentMethod.BOLETO,
      },
      targetMonthStart: referenceMonth,
      targetEntries: [
        {
          description: "Internet Fibra",
          personId: "person-1",
          accountId: "account-1",
          categoryId: "category-1",
          paymentMethod: PaymentMethod.BOLETO,
          type: EntryType.EXPENSE,
          competenceDate: referenceMonth,
        },
      ],
    });

    expect(shouldGenerate).toBe(false);
  });

  it("não duplica quando já existe uma ocorrência única estruturalmente equivalente no mês", () => {
    const shouldGenerate = shouldGenerateFixedEntry({
      template: {
        description: "Internet Fibra",
        personId: "person-1",
        accountId: "account-1",
        categoryId: "category-1",
        paymentMethod: PaymentMethod.BOLETO,
      },
      targetMonthStart: referenceMonth,
      targetEntries: [
        {
          description: "Internet de casa - ajustado em maio",
          personId: "person-1",
          accountId: "account-1",
          categoryId: "category-1",
          paymentMethod: PaymentMethod.BOLETO,
          type: EntryType.EXPENSE,
          competenceDate: referenceMonth,
        },
      ],
    });

    expect(shouldGenerate).toBe(false);
  });

  it("gera um novo fixo quando a conta é diferente", () => {
    const shouldGenerate = shouldGenerateFixedEntry({
      template: {
        description: "Internet Fibra",
        personId: "person-1",
        accountId: "account-2",
        categoryId: "category-1",
        paymentMethod: PaymentMethod.BOLETO,
      },
      targetMonthStart: referenceMonth,
      targetEntries: [
        {
          description: "Internet Fibra",
          personId: "person-1",
          accountId: "account-1",
          categoryId: "category-1",
          paymentMethod: PaymentMethod.BOLETO,
          type: EntryType.EXPENSE,
          competenceDate: referenceMonth,
        },
      ],
    });

    expect(shouldGenerate).toBe(true);
  });
});
