import { EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";

type CashSummaryEntry = {
  type: EntryType;
  amount: number;
  paymentMethod: PaymentMethod;
  settlementStatus: SettlementStatus;
  competenceDate: Date;
  personId?: string | null;
  personName?: string | null;
};

type CashAndCardSummaryInput = {
  cashEntries: CashSummaryEntry[];
  periodStart: Date;
  periodEnd: Date;
  nextInvoiceAmount: number;
  futureCardCommitmentsAmount: number;
};

export type FutureInvoiceGroupingEntry = {
  id: string;
  description: string;
  cardId: string;
  cardName: string;
  competenceDate: Date;
  dueDate: Date | null;
  amount: number;
  installment?: {
    number: number;
    total: number;
  } | null;
};

type AvailableCashBreakdownGroup = {
  id: string;
  label: string;
  previousBalance: number;
  income: number;
  expenses: number;
  saved: number;
  net: number;
};

function isCreditCardPaymentMethod(paymentMethod: PaymentMethod) {
  return paymentMethod === PaymentMethod.CREDIT_SINGLE || paymentMethod === PaymentMethod.CREDIT_INSTALLMENT;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatInvoiceMonth(date: Date) {
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

  return `${capitalizedMonth}/${date.getFullYear()}`;
}

function createBreakdownGroup(id: string, label: string): AvailableCashBreakdownGroup {
  return {
    id,
    label,
    previousBalance: 0,
    income: 0,
    expenses: 0,
    saved: 0,
    net: 0,
  };
}

function getEntryCashImpact(entry: CashSummaryEntry) {
  if (entry.type === EntryType.INCOME) {
    return entry.amount;
  }

  if (entry.type === EntryType.EXPENSE || entry.type === EntryType.SAVED) {
    return -entry.amount;
  }

  return 0;
}

function updateGroupNet(group: AvailableCashBreakdownGroup) {
  group.net = group.previousBalance + group.income - group.expenses - group.saved;
}

function applyEntryToBreakdown(group: AvailableCashBreakdownGroup, entry: CashSummaryEntry, periodStart: Date) {
  if (entry.competenceDate < periodStart) {
    group.previousBalance += getEntryCashImpact(entry);
    updateGroupNet(group);
    return;
  }

  if (entry.type === EntryType.INCOME) {
    group.income += entry.amount;
  }

  if (entry.type === EntryType.EXPENSE) {
    group.expenses += entry.amount;
  }

  if (entry.type === EntryType.SAVED) {
    group.saved += entry.amount;
  }

  updateGroupNet(group);
}

function sortBreakdownGroups(groups: Iterable<AvailableCashBreakdownGroup>) {
  return Array.from(groups).sort((left, right) => left.label.localeCompare(right.label));
}

export function calculateAvailableCashBreakdown(
  entries: CashSummaryEntry[],
  period: {
    start: Date;
    end: Date;
  },
) {
  const totals = createBreakdownGroup("total", "Total");
  const people = new Map<string, AvailableCashBreakdownGroup>();

  entries
    .filter((entry) => entry.settlementStatus === SettlementStatus.SETTLED && entry.competenceDate < period.end)
    .forEach((entry) => {
      const personId = entry.personId ?? "sem-pessoa";

      if (!people.has(personId)) {
        people.set(personId, createBreakdownGroup(personId, entry.personName ?? "Sem titular"));
      }

      applyEntryToBreakdown(totals, entry, period.start);
      applyEntryToBreakdown(people.get(personId)!, entry, period.start);
    });

  return {
    totals,
    people: sortBreakdownGroups(people.values()),
  };
}

export function calculateCashAndCardSummary(input: CashAndCardSummaryInput) {
  const availableCashBreakdown = calculateAvailableCashBreakdown(input.cashEntries, {
    start: input.periodStart,
    end: input.periodEnd,
  });
  const availableCash = availableCashBreakdown.totals.net;

  return {
    availableCash,
    availableCashBreakdown,
    nextInvoiceTotal: input.nextInvoiceAmount,
    futureCardCommitments: input.futureCardCommitmentsAmount,
    projectedAfterNextInvoice: availableCash - input.nextInvoiceAmount,
  };
}

export function shouldIncludeEntryInAvailableCash(entry: CashSummaryEntry) {
  if (entry.type === EntryType.EXPENSE && isCreditCardPaymentMethod(entry.paymentMethod)) {
    return entry.settlementStatus === SettlementStatus.SETTLED;
  }

  return entry.settlementStatus === SettlementStatus.SETTLED;
}

export function groupFutureCreditInvoices(entries: FutureInvoiceGroupingEntry[]) {
  const invoiceGroups = new Map<
    string,
    {
      id: string;
      cardName: string;
      competenceDate: Date;
      dueDate: Date | null;
      amount: number;
      items: Array<{
        id: string;
        description: string;
        amount: number;
        invoiceMonthLabel: string;
        dueDateLabel: string;
        installmentLabel: string | null;
        lastInstallmentLabel: string | null;
      }>;
    }
  >();
  const monthGroups = new Map<
    string,
    {
      monthKey: string;
      monthLabel: string;
      total: number;
    }
  >();

  entries.forEach((entry) => {
    const monthKey = getMonthKey(entry.competenceDate);
    const dueDateKey = entry.dueDate ? formatDateLabel(entry.dueDate) : "sem-vencimento";
    const groupKey = `${entry.cardId}-${monthKey}-${dueDateKey}`;
    const current = invoiceGroups.get(groupKey);
    const invoiceMonthLabel = formatInvoiceMonth(entry.competenceDate);
    const dueDateLabel = entry.dueDate ? formatDateLabel(entry.dueDate) : "sem vencimento";
    const lastInstallmentDate = entry.installment
      ? new Date(
          entry.competenceDate.getFullYear(),
          entry.competenceDate.getMonth() + Math.max(entry.installment.total - entry.installment.number, 0),
          1,
        )
      : null;
    const item = {
      id: entry.id,
      description: entry.description,
      amount: entry.amount,
      invoiceMonthLabel,
      dueDateLabel,
      installmentLabel: entry.installment ? `${entry.installment.number}/${entry.installment.total}` : null,
      lastInstallmentLabel: lastInstallmentDate ? formatInvoiceMonth(lastInstallmentDate) : null,
    };

    if (current) {
      current.amount += entry.amount;
      current.items.push(item);
    } else {
      invoiceGroups.set(groupKey, {
        id: groupKey,
        cardName: entry.cardName,
        competenceDate: entry.competenceDate,
        dueDate: entry.dueDate,
        amount: entry.amount,
        items: [item],
      });
    }

    const monthGroup = monthGroups.get(monthKey);

    if (monthGroup) {
      monthGroup.total += entry.amount;
    } else {
      monthGroups.set(monthKey, {
        monthKey,
        monthLabel: formatInvoiceMonth(entry.competenceDate),
        total: entry.amount,
      });
    }
  });

  const invoices = Array.from(invoiceGroups.values())
    .sort((left, right) => {
      const competenceDiff = left.competenceDate.getTime() - right.competenceDate.getTime();

      if (competenceDiff !== 0) {
        return competenceDiff;
      }

      const dueDiff = (left.dueDate?.getTime() ?? 0) - (right.dueDate?.getTime() ?? 0);

      if (dueDiff !== 0) {
        return dueDiff;
      }

      return left.cardName.localeCompare(right.cardName);
    })
    .map((invoice) => ({
      id: invoice.id,
      cardName: invoice.cardName,
      invoiceMonthKey: getMonthKey(invoice.competenceDate),
      invoiceMonthLabel: formatInvoiceMonth(invoice.competenceDate),
      dueDateLabel: invoice.dueDate ? formatDateLabel(invoice.dueDate) : "sem vencimento",
      amount: invoice.amount,
      items: invoice.items.sort((left, right) => left.description.localeCompare(right.description)),
    }));

  const groups = Array.from(monthGroups.values())
    .sort((left, right) => left.monthKey.localeCompare(right.monthKey))
    .map((group) => ({
      monthKey: group.monthKey,
      monthLabel: group.monthLabel,
      total: group.total,
      invoices: invoices.filter((invoice) => invoice.invoiceMonthKey === group.monthKey),
    }));
  const nextInvoice = groups[0] ?? null;
  const nextInvoiceDueDates = nextInvoice
    ? Array.from(new Set(nextInvoice.invoices.map((invoice) => invoice.dueDateLabel)))
    : [];

  return {
    groups,
    nextInvoice: nextInvoice
      ? {
          monthKey: nextInvoice.monthKey,
          monthLabel: nextInvoice.monthLabel,
          total: nextInvoice.total,
          dueDateLabel: nextInvoiceDueDates.length === 1 ? nextInvoiceDueDates[0] : "vários vencimentos",
          cards: nextInvoice.invoices.map((invoice) => ({
            id: invoice.id,
            cardName: invoice.cardName,
            dueDateLabel: invoice.dueDateLabel,
            amount: invoice.amount,
          })),
        }
      : null,
  };
}
