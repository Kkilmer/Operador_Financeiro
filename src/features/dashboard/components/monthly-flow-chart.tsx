"use client";

import { useMemo, useState } from "react";

import { SectionCard } from "@/components/ui/section-card";
import { DashboardMonthlyFlowItem } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type MonthlyFlowChartProps = {
  items: DashboardMonthlyFlowItem[];
  chartYear: number;
  availableYears: number[];
  selectedMonth: string;
};

const SVG_WIDTH = 760;
const SVG_HEIGHT = 280;
const PADDING_LEFT = 42;
const PADDING_RIGHT = 16;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 36;

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return "";
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function MonthlyFlowChart({
  items,
  chartYear,
  availableYears,
  selectedMonth,
}: MonthlyFlowChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const maxValue = Math.max(...items.flatMap((item) => [item.income, item.expense]), 0);
    const safeMax = maxValue > 0 ? maxValue : 1;
    const innerWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const innerHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const stepX = items.length > 1 ? innerWidth / (items.length - 1) : 0;

    const incomePoints = items.map((item, index) => ({
      x: PADDING_LEFT + stepX * index,
      y: PADDING_TOP + innerHeight - (item.income / safeMax) * innerHeight,
    }));

    const expensePoints = items.map((item, index) => ({
      x: PADDING_LEFT + stepX * index,
      y: PADDING_TOP + innerHeight - (item.expense / safeMax) * innerHeight,
    }));

    const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      y: PADDING_TOP + innerHeight - ratio * innerHeight,
      value: safeMax * ratio,
    }));

    return {
      innerHeight,
      incomePoints,
      expensePoints,
      gridValues,
      incomePath: buildLinePath(incomePoints),
      expensePath: buildLinePath(expensePoints),
    };
  }, [items]);

  const hoveredItem = hoveredIndex != null ? items[hoveredIndex] : null;

  return (
    <SectionCard
      title="Entradas e saídas por mês"
      description="Compare o que entrou e o que saiu ao longo do ano selecionado."
    >
      <div className="space-y-5">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="month" value={selectedMonth} />
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-600">Ano</span>
            <select
              name="year"
              defaultValue={String(chartYear)}
              className="min-h-11 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Aplicar ano
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              Entradas
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
              Saídas
            </div>
          </div>

          <div className="relative">
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="h-[280px] w-full">
              {chart.gridValues.map((grid) => (
                <g key={grid.y}>
                  <line
                    x1={PADDING_LEFT}
                    y1={grid.y}
                    x2={SVG_WIDTH - PADDING_RIGHT}
                    y2={grid.y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={PADDING_LEFT - 8}
                    y={grid.y + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px]"
                  >
                    {formatCompactCurrency(grid.value)}
                  </text>
                </g>
              ))}

              <path d={chart.incomePath} fill="none" stroke="#10b981" strokeWidth="3" />
              <path d={chart.expensePath} fill="none" stroke="#f43f5e" strokeWidth="3" />

              {items.map((item, index) => {
                const incomePoint = chart.incomePoints[index];
                const expensePoint = chart.expensePoints[index];
                const isHovered = hoveredIndex === index;

                return (
                  <g key={item.monthKey}>
                    <line
                      x1={incomePoint.x}
                      y1={PADDING_TOP}
                      x2={incomePoint.x}
                      y2={PADDING_TOP + chart.innerHeight}
                      stroke={isHovered ? "#cbd5e1" : "transparent"}
                    />

                    <circle cx={incomePoint.x} cy={incomePoint.y} r="5" fill="#10b981" />
                    <circle cx={expensePoint.x} cy={expensePoint.y} r="5" fill="#f43f5e" />

                    <rect
                      x={incomePoint.x - 18}
                      y={PADDING_TOP}
                      width="36"
                      height={chart.innerHeight}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
                    />

                    <text
                      x={incomePoint.x}
                      y={SVG_HEIGHT - 10}
                      textAnchor="middle"
                      className="fill-slate-500 text-[11px]"
                    >
                      {item.monthLabel}
                    </text>
                  </g>
                );
              })}
            </svg>

            {hoveredItem ? (
              <div className="pointer-events-none absolute right-4 top-4 w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                <p className="text-sm font-semibold text-slate-900">{hoveredItem.monthLabel}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>Entradas: <span className="font-medium text-emerald-700">{formatCurrency(hoveredItem.income)}</span></p>
                  <p>Saídas: <span className="font-medium text-rose-700">{formatCurrency(hoveredItem.expense)}</span></p>
                  <p>Saldo: <span className="font-medium text-slate-900">{formatCurrency(hoveredItem.balance)}</span></p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
