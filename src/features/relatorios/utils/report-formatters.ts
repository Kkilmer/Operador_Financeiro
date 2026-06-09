import { EntryType } from "@prisma/client";

export function formatReportCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatReportDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatReportDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getReportEntryTypeLabel(type: EntryType) {
  if (type === EntryType.INCOME) {
    return "Entrada";
  }

  if (type === EntryType.SAVED) {
    return "Guardado";
  }

  return "Saída";
}
