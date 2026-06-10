"use client";

import { useState } from "react";

import {
  ReportQueryParams,
  ReportScope,
  ReportUserOption,
  reportPeriodTypes,
  ReportPeriodType,
} from "@/features/relatorios/types/report.types";

const periodLabels: Record<ReportPeriodType, string> = {
  monthly: "Mensal",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  custom: "Personalizado",
};

const months = [
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

function isPeriodType(value?: string): value is ReportPeriodType {
  return reportPeriodTypes.includes(value as ReportPeriodType);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Select({
  name,
  value,
  defaultValue,
  onChange,
  children,
}: {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
    >
      {children}
    </select>
  );
}

function TextInput({
  name,
  type = "text",
  defaultValue,
}: {
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
    />
  );
}

export function ReportFilters({
  query,
  scope,
  availableUsers,
  isAdmin,
}: {
  query: ReportQueryParams;
  scope: ReportScope;
  availableUsers: ReportUserOption[];
  isAdmin: boolean;
}) {
  const now = new Date();
  const [periodType, setPeriodType] = useState<ReportPeriodType>(
    isPeriodType(query.periodType) ? query.periodType : "monthly",
  );
  const [scopeType, setScopeType] = useState(scope.type);
  const selectedYear = query.year ?? String(now.getFullYear());
  const years = Array.from({ length: 9 }, (_, index) => now.getFullYear() - 5 + index);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Filtros do relatório</h2>
        <p className="text-sm text-slate-500">
          Escolha o período e gere uma visão consolidada sem misturar dados entre usuários.
        </p>
      </div>

      <form method="get" className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Tipo de período">
            <Select
              name="periodType"
              value={periodType}
              onChange={(event) => setPeriodType(event.target.value as ReportPeriodType)}
            >
              {reportPeriodTypes.map((type) => (
                <option key={type} value={type}>
                  {periodLabels[type]}
                </option>
              ))}
            </Select>
          </Field>

          {periodType !== "custom" ? (
            <Field label="Ano">
              <Select name="year" defaultValue={selectedYear}>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {periodType === "monthly" ? (
            <Field label="Mês">
              <Select name="month" defaultValue={query.month ?? String(now.getMonth() + 1)}>
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {periodType === "bimonthly" ? (
            <Field label="Bimestre">
              <Select name="bimester" defaultValue={query.bimester ?? "1"}>
                {Array.from({ length: 6 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1}º bimestre
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {periodType === "quarterly" ? (
            <Field label="Trimestre">
              <Select name="quarter" defaultValue={query.quarter ?? "1"}>
                {Array.from({ length: 4 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1}º trimestre
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {periodType === "semiannual" ? (
            <Field label="Semestre">
              <Select name="semester" defaultValue={query.semester ?? "1"}>
                <option value="1">1º semestre</option>
                <option value="2">2º semestre</option>
              </Select>
            </Field>
          ) : null}

          {periodType === "custom" ? (
            <>
              <Field label="Data inicial">
                <TextInput name="startDate" type="date" defaultValue={query.startDate} />
              </Field>
              <Field label="Data final">
                <TextInput name="endDate" type="date" defaultValue={query.endDate} />
              </Field>
            </>
          ) : null}

          {isAdmin ? (
            <Field label="Escopo">
              <Select
                name="scope"
                value={scopeType}
                onChange={(event) => setScopeType(event.target.value as typeof scopeType)}
              >
                <option value="mine">Meu relatório</option>
                <option value="user">Usuário específico</option>
                <option value="all">Todos os usuários</option>
              </Select>
            </Field>
          ) : null}

          {isAdmin && scopeType === "user" ? (
            <Field label="Usuário">
              <Select name="targetUserId" defaultValue={scope.selectedUserId ?? availableUsers[0]?.id}>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            Gerar relatório
          </button>
          <a
            href="/relatorios"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpar filtros
          </a>
        </div>
      </form>
    </section>
  );
}
