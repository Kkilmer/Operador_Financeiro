import { EntryType, PaymentMethod } from "@prisma/client";

type FixedEntryFingerprint = {
  description: string;
  personId: string;
  accountId: string;
  categoryId: string | null;
  paymentMethod: PaymentMethod;
  type: EntryType;
  competenceDate: Date;
};

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getStrictFixedEntryKey(entry: FixedEntryFingerprint) {
  return [
    getMonthKey(entry.competenceDate),
    entry.type,
    entry.description.trim().toLowerCase(),
    entry.personId,
    entry.accountId,
    entry.categoryId ?? "",
    entry.paymentMethod,
  ].join("::");
}

export function getStructuralFixedEntryKey(entry: Omit<FixedEntryFingerprint, "description">) {
  return [
    getMonthKey(entry.competenceDate),
    entry.type,
    entry.personId,
    entry.accountId,
    entry.categoryId ?? "",
    entry.paymentMethod,
  ].join("::");
}

export function shouldGenerateFixedEntry(params: {
  template: Omit<FixedEntryFingerprint, "competenceDate" | "type">;
  targetMonthStart: Date;
  targetEntries: FixedEntryFingerprint[];
}) {
  const targetFingerprint: FixedEntryFingerprint = {
    ...params.template,
    competenceDate: params.targetMonthStart,
    type: EntryType.EXPENSE,
  };

  const strictKey = getStrictFixedEntryKey(targetFingerprint);
  const targetStrictKeys = new Set(params.targetEntries.map((entry) => getStrictFixedEntryKey(entry)));

  if (targetStrictKeys.has(strictKey)) {
    return false;
  }

  const structuralKey = getStructuralFixedEntryKey(targetFingerprint);
  const structuralCount = params.targetEntries.filter(
    (entry) => getStructuralFixedEntryKey(entry) === structuralKey,
  ).length;

  return structuralCount !== 1;
}
