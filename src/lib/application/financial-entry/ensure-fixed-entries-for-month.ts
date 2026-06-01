import {
  EntryFrequencyProfile,
  EntryOrigin,
  EntryType,
  SettlementStatus,
} from "@prisma/client";

import { requireCurrentUserId } from "@/lib/auth/session";
import {
  getStrictFixedEntryKey,
  getStructuralFixedEntryKey,
} from "@/lib/application/financial-entry/fixed-entry-dedup";
import { prisma } from "@/lib/prisma/client";

function getReferenceMonthDate(referenceMonth?: string) {
  if (!referenceMonth) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const match = /^(\d{4})-(\d{2})$/.exec(referenceMonth);

  if (!match) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

function getMonthBounds(referenceMonth?: string) {
  const start = getReferenceMonthDate(referenceMonth);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const previousStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const previousEnd = start;

  return { start, end, previousStart, previousEnd };
}

function shiftDateToMonth(sourceDate: Date, targetMonthStart: Date) {
  const day = sourceDate.getDate();
  const lastDayOfTargetMonth = new Date(
    targetMonthStart.getFullYear(),
    targetMonthStart.getMonth() + 1,
    0,
  ).getDate();

  return new Date(
    targetMonthStart.getFullYear(),
    targetMonthStart.getMonth(),
    Math.min(day, lastDayOfTargetMonth),
  );
}

export async function ensureFixedEntriesForMonth(referenceMonth?: string) {
  const userId = await requireCurrentUserId();
  const { start, end, previousStart, previousEnd } = getMonthBounds(referenceMonth);

  const previousMonthFixedEntries = await prisma.financialEntry.findMany({
    where: {
      userId,
      type: EntryType.EXPENSE,
      frequencyProfile: EntryFrequencyProfile.FIXED,
      isInstallment: false,
      competenceDate: {
        gte: previousStart,
        lt: previousEnd,
      },
    },
    orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
    select: {
      description: true,
      amount: true,
      eventDate: true,
      competenceDate: true,
      personId: true,
      accountId: true,
      categoryId: true,
      paymentMethod: true,
      notes: true,
    },
  });

  if (previousMonthFixedEntries.length === 0) {
    return;
  }

  const targetEntries = await prisma.financialEntry.findMany({
    where: {
      userId,
      type: EntryType.EXPENSE,
      frequencyProfile: EntryFrequencyProfile.FIXED,
      isInstallment: false,
      competenceDate: {
        gte: start,
        lt: end,
      },
    },
    select: {
      description: true,
      personId: true,
      accountId: true,
      categoryId: true,
      paymentMethod: true,
      type: true,
      competenceDate: true,
      id: true,
      origin: true,
      frequencyProfile: true,
      settlementStatus: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  const generatedEntriesToFix = targetEntries.filter((entry) => {
    return (
      entry.deletedAt == null &&
      entry.origin === EntryOrigin.RECURRING_GENERATED &&
      entry.frequencyProfile === EntryFrequencyProfile.FIXED &&
      entry.settlementStatus === SettlementStatus.SETTLED &&
      entry.createdAt.getTime() === entry.updatedAt.getTime()
    );
  });

  if (generatedEntriesToFix.length > 0) {
    await prisma.financialEntry.updateMany({
      where: {
        id: {
          in: generatedEntriesToFix.map((entry) => entry.id),
        },
      },
      data: {
        settlementStatus: SettlementStatus.PENDING,
      },
    });
  }

  const targetStrictKeys = new Set(targetEntries.map((entry) => getStrictFixedEntryKey(entry)));
  const targetStructuralCounts = new Map<string, number>();

  for (const entry of targetEntries) {
    const structuralKey = getStructuralFixedEntryKey(entry);
    targetStructuralCounts.set(structuralKey, (targetStructuralCounts.get(structuralKey) ?? 0) + 1);
  }

  for (const template of previousMonthFixedEntries) {
    const strictKey = getStrictFixedEntryKey({
      ...template,
      type: EntryType.EXPENSE,
      competenceDate: start,
    });

    if (targetStrictKeys.has(strictKey)) {
      continue;
    }

    const structuralKey = getStructuralFixedEntryKey({
      ...template,
      type: EntryType.EXPENSE,
      competenceDate: start,
    });

    if ((targetStructuralCounts.get(structuralKey) ?? 0) === 1) {
      continue;
    }

    await prisma.financialEntry.create({
      data: {
        description: template.description,
        amount: template.amount,
        eventDate: shiftDateToMonth(template.eventDate, start),
        competenceDate: start,
        type: EntryType.EXPENSE,
        userId,
        personId: template.personId,
        accountId: template.accountId,
        categoryId: template.categoryId,
        paymentMethod: template.paymentMethod,
        settlementStatus: SettlementStatus.PENDING,
        frequencyProfile: EntryFrequencyProfile.FIXED,
        isInstallment: false,
        notes: template.notes,
        origin: EntryOrigin.RECURRING_GENERATED,
      },
    });

    targetStrictKeys.add(strictKey);
    targetStructuralCounts.set(structuralKey, (targetStructuralCounts.get(structuralKey) ?? 0) + 1);
  }
}
