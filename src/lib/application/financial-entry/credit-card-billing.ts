import { PaymentMethod } from "@prisma/client";

type CreditCardBillingInput = {
  purchaseDate: Date;
  closingDay: number;
  dueDay: number;
  installmentOffset?: number;
};

type CreditCardBillingDate = {
  billingMonth: string;
  competenceDate: Date;
  dueDate: Date;
};

function assertValidBillingDay(day: number, fieldName: string) {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error(`${fieldName} deve ser um dia entre 1 e 31.`);
  }
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatBillingMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isCreditCardPaymentMethod(paymentMethod: PaymentMethod) {
  return paymentMethod === PaymentMethod.CREDIT_SINGLE || paymentMethod === PaymentMethod.CREDIT_INSTALLMENT;
}

export function requireCreditCardBillingConfig(account: { closingDay: number | null; dueDay: number | null }) {
  if (account.closingDay == null || account.dueDay == null) {
    throw new Error("Configure o fechamento e o vencimento do cartão antes de lançar compras no crédito.");
  }

  return {
    closingDay: account.closingDay,
    dueDay: account.dueDay,
  };
}

export function calculateCreditCardBillingDate({
  purchaseDate,
  closingDay,
  dueDay,
  installmentOffset = 0,
}: CreditCardBillingInput): CreditCardBillingDate {
  assertValidBillingDay(closingDay, "Dia de fechamento");
  assertValidBillingDay(dueDay, "Dia de vencimento");

  if (!Number.isInteger(installmentOffset) || installmentOffset < 0) {
    throw new Error("O deslocamento da parcela deve ser zero ou maior.");
  }

  const purchaseYear = purchaseDate.getFullYear();
  const purchaseMonth = purchaseDate.getMonth();
  const effectiveClosingDay = Math.min(
    closingDay,
    lastDayOfMonth(purchaseYear, purchaseMonth),
  );
  const monthsToFirstInvoice = purchaseDate.getDate() <= effectiveClosingDay ? 1 : 2;
  const competenceDate = new Date(
    purchaseYear,
    purchaseMonth + monthsToFirstInvoice + installmentOffset,
    1,
  );
  const dueDate = new Date(
    competenceDate.getFullYear(),
    competenceDate.getMonth(),
    Math.min(dueDay, lastDayOfMonth(competenceDate.getFullYear(), competenceDate.getMonth())),
  );

  return {
    billingMonth: formatBillingMonth(competenceDate),
    competenceDate,
    dueDate,
  };
}
