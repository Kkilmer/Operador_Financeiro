import {
  EntryFrequencyProfile,
  EntryOrigin,
  EntryType,
  SettlementStatus,
} from "@prisma/client";

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

function getEntryKey(entry: {
  description: string;
  personId: string;
  categoryId: string | null;
}) {
  return [
    entry.description.trim().toLowerCase(),
    entry.personId,
    entry.categoryId ?? "",
  ].join("::");
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
  const { start, end, previousStart, previousEnd } = getMonthBounds(referenceMonth);

  const previousMonthFixedEntries = await prisma.financialEntry.findMany({
    where: {
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
      competenceDate: {
        gte: start,
        lt: end,
      },
    },
    select: {
      description: true,
      personId: true,
      categoryId: true,
      id: true,
      origin: true,
      frequencyProfile: true,
      settlementStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const generatedEntriesToFix = targetEntries.filter((entry) => {
    return (
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

  const targetKeys = new Set(targetEntries.map((entry) => getEntryKey(entry)));

  for (const template of previousMonthFixedEntries) {
    const key = getEntryKey(template);

    if (targetKeys.has(key)) {
      continue;
    }

    await prisma.financialEntry.create({
      data: {
        description: template.description,
        amount: template.amount,
        eventDate: shiftDateToMonth(template.eventDate, start),
        competenceDate: start,
        type: EntryType.EXPENSE,
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

    targetKeys.add(key);
  }
}
