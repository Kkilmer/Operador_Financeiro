import { ReportPeriod, ReportPeriodType, ReportQueryParams, reportPeriodTypes } from "@/features/relatorios/types/report.types";

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MAX_CUSTOM_RANGE_IN_DAYS = 731;

function parseIntInRange(value: string | undefined, min: number, max: number, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }

  return parsed;
}

function parsePeriodType(value?: string): ReportPeriodType {
  return reportPeriodTypes.includes(value as ReportPeriodType) ? (value as ReportPeriodType) : "monthly";
}

function parseDateOnly(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getMonthPeriod(year: number, month: number, type: ReportPeriodType = "monthly"): ReportPeriod {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return {
    type,
    startDate,
    endDate,
    label: `${monthNames[month - 1]} de ${year}`,
    granularity: "day",
  };
}

export function getReportPeriod(query: ReportQueryParams, now = new Date()): ReportPeriod {
  const type = parsePeriodType(query.periodType);
  const year = parseIntInRange(query.year, 2000, 2100, now.getFullYear());

  if (type === "monthly") {
    const month = parseIntInRange(query.month, 1, 12, now.getMonth() + 1);
    return getMonthPeriod(year, month, "monthly");
  }

  if (type === "bimonthly") {
    const bimester = parseIntInRange(query.bimester, 1, 6, 1);
    const startMonth = (bimester - 1) * 2;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 2, 1);

    return {
      type,
      startDate,
      endDate,
      label: `${bimester}º bimestre de ${year}`,
      granularity: "month",
    };
  }

  if (type === "quarterly") {
    const quarter = parseIntInRange(query.quarter, 1, 4, 1);
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 1);

    return {
      type,
      startDate,
      endDate,
      label: `${quarter}º trimestre de ${year}`,
      granularity: "month",
    };
  }

  if (type === "semiannual") {
    const semester = parseIntInRange(query.semester, 1, 2, 1);
    const startMonth = semester === 1 ? 0 : 6;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 6, 1);

    return {
      type,
      startDate,
      endDate,
      label: `${semester}º semestre de ${year}`,
      granularity: "month",
    };
  }

  if (type === "annual") {
    return {
      type,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year + 1, 0, 1),
      label: `Ano de ${year}`,
      granularity: "month",
    };
  }

  const fallback = getMonthPeriod(now.getFullYear(), now.getMonth() + 1, "custom");
  const startDate = parseDateOnly(query.startDate);
  const endDateInclusive = parseDateOnly(query.endDate);

  if (!startDate || !endDateInclusive) {
    return {
      ...fallback,
      label: `${fallback.label} (período personalizado inválido)`,
      warning: "Informe uma data inicial e final válidas para o período personalizado.",
    };
  }

  if (startDate > endDateInclusive) {
    return {
      ...fallback,
      label: `${fallback.label} (período personalizado inválido)`,
      warning: "A data inicial não pode ser maior que a data final.",
    };
  }

  const days = Math.ceil((endDateInclusive.getTime() - startDate.getTime()) / 86_400_000) + 1;

  if (days > MAX_CUSTOM_RANGE_IN_DAYS) {
    return {
      ...fallback,
      label: `${fallback.label} (período personalizado inválido)`,
      warning: "O período personalizado não pode ultrapassar 24 meses.",
    };
  }

  return {
    type,
    startDate,
    endDate: addDays(endDateInclusive, 1),
    label: `${getDateOnly(startDate)} a ${getDateOnly(endDateInclusive)}`,
    granularity: days <= 45 ? "day" : "month",
  };
}

export function getReportPeriodDefaults(now = new Date()) {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}
