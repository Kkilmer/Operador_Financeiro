"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionCard } from "@/components/ui/section-card";
import { ReportEvolutionPoint } from "@/features/relatorios/types/report.types";
import { formatCurrency } from "@/lib/utils/currency";

const names: Record<string, string> = {
  income: "Entradas",
  expense: "Saídas",
  balance: "Saldo",
};

export function ReportEvolutionChart({ data }: { data: ReportEvolutionPoint[] }) {
  return (
    <SectionCard
      title="Evolução financeira"
      description="Acompanhe entradas, saídas e saldo acumulado dentro do período."
    >
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(Number(value)).replace("R$", "").trim()}
              width={72}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                names[String(name)] ?? String(name),
              ]}
              labelClassName="font-medium text-slate-900"
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
              }}
            />
            <Legend formatter={(value) => names[String(value)] ?? String(value)} />
            <Line type="monotone" dataKey="income" stroke="#059669" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="expense" stroke="#e11d48" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="balance" stroke="#0f172a" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
