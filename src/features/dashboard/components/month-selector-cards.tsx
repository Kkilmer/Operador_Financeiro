import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

const months = [
  { label: "Jan", value: "01" },
  { label: "Fev", value: "02" },
  { label: "Mar", value: "03" },
  { label: "Abr", value: "04" },
  { label: "Mai", value: "05" },
  { label: "Jun", value: "06" },
  { label: "Jul", value: "07" },
  { label: "Ago", value: "08" },
  { label: "Set", value: "09" },
  { label: "Out", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dez", value: "12" },
] as const;

type MonthSelectorCardsProps = {
  selectedMonth: string;
  selectedYear?: string;
  basePath?: "/dashboard" | "/lancamentos";
  queryParams?: Record<string, string | undefined>;
  includeYearParam?: boolean;
  helperText?: string;
  tone?: "dark" | "light";
};

function parseSelectedMonth(selectedMonth: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(selectedMonth);

  if (!match) {
    const now = new Date();
    return {
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1).padStart(2, "0"),
    };
  }

  return {
    year: match[1],
    month: match[2],
  };
}

function buildMonthHref({
  basePath,
  month,
  year,
  queryParams,
  includeYearParam,
}: {
  basePath: string;
  month: string;
  year: string;
  queryParams: Record<string, string | undefined>;
  includeYearParam: boolean;
}): Route {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(queryParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  params.set("month", month);

  if (includeYearParam) {
    params.set("year", year);
  } else {
    params.delete("year");
  }

  return `${basePath}?${params.toString()}` as Route;
}

export function MonthSelectorCards({
  selectedMonth,
  selectedYear,
  basePath = "/dashboard",
  queryParams = {},
  includeYearParam = true,
  helperText = "Toque em um mês para atualizar o resumo.",
  tone = "dark",
}: MonthSelectorCardsProps) {
  const parsed = parseSelectedMonth(selectedMonth);
  const year = selectedYear && /^\d{4}$/.test(selectedYear) ? selectedYear : parsed.year;
  const previousYear = String(Number(year) - 1);
  const nextYear = String(Number(year) + 1);
  const isDark = tone === "dark";

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-[0.22em]",
              isDark ? "text-slate-400" : "text-slate-500",
            )}
          >
            Mês de referência
          </p>
          <p className={cn("mt-1 text-sm", isDark ? "text-slate-300" : "text-slate-500")}>
            {helperText}
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-full border p-1",
            isDark ? "border-slate-700 bg-slate-950/70" : "border-slate-200 bg-slate-50",
          )}
        >
          <Link
            href={buildMonthHref({
              basePath,
              month: `${previousYear}-${parsed.month}`,
              year: previousYear,
              queryParams,
              includeYearParam,
            })}
            aria-label={`Ver meses de ${previousYear}`}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full text-sm font-semibold transition",
              isDark
                ? "text-slate-300 hover:bg-slate-900 hover:text-white"
                : "text-slate-600 hover:bg-white hover:text-slate-900",
            )}
          >
            ‹
          </Link>
          <span
            className={cn(
              "min-w-14 text-center text-sm font-semibold",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            {year}
          </span>
          <Link
            href={buildMonthHref({
              basePath,
              month: `${nextYear}-${parsed.month}`,
              year: nextYear,
              queryParams,
              includeYearParam,
            })}
            aria-label={`Ver meses de ${nextYear}`}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full text-sm font-semibold transition",
              isDark
                ? "text-slate-300 hover:bg-slate-900 hover:text-white"
                : "text-slate-600 hover:bg-white hover:text-slate-900",
            )}
          >
            ›
          </Link>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <div className="flex min-w-max gap-2 lg:min-w-0 lg:grid lg:grid-cols-12">
          {months.map((month) => {
            const monthValue = `${year}-${month.value}`;
            const active = month.value === parsed.month && year === parsed.year;

            return (
              <Link
                key={month.value}
                href={buildMonthHref({
                  basePath,
                  month: monthValue,
                  year,
                  queryParams,
                  includeYearParam,
                })}
                aria-current={active ? "date" : undefined}
                className={cn(
                  "inline-flex min-h-12 min-w-16 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 lg:min-w-0 lg:px-2",
                  isDark ? "focus-visible:ring-white/60" : "focus-visible:ring-brand-200",
                  active
                    ? isDark
                      ? "border-white bg-white text-slate-950 shadow-sm"
                      : "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : isDark
                      ? "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:bg-slate-900 hover:text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800",
                )}
              >
                {month.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
