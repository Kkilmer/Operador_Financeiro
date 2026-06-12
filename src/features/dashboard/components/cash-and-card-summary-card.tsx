"use client";

import { useState } from "react";

import {
  DashboardAvailableCashBreakdownGroup,
  DashboardCashAndCardSummary,
} from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

type CashAndCardSummaryCardProps = {
  summary: DashboardCashAndCardSummary;
};

function MetricCard({
  label,
  value,
  tone,
  helperText,
  isExpanded,
  controls,
  onToggle,
}: {
  label: string;
  value: number;
  tone: "positive" | "warning" | "neutral";
  helperText?: string | null;
  isExpanded?: boolean;
  controls?: string;
  onToggle?: () => void;
}) {
  const className = cn(
    "rounded-2xl border p-4 text-left transition",
    tone === "positive" && "border-emerald-200 bg-emerald-50",
    tone === "warning" && "border-amber-200 bg-amber-50",
    tone === "neutral" && "border-slate-200 bg-slate-50",
    onToggle &&
      "w-full cursor-pointer hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
  );
  const content = (
    <>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(value)}</p>
      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
      {onToggle ? (
        <span
          className={cn(
            "mt-3 inline-flex text-sm font-medium",
            tone === "positive" && "text-emerald-800",
            tone === "warning" && "text-amber-800",
            tone === "neutral" && "text-slate-700",
          )}
        >
          {isExpanded ? "▲ Ocultar detalhes" : "▼ Ver detalhes"}
        </span>
      ) : null}
    </>
  );

  if (onToggle) {
    return (
      <button type="button" aria-expanded={isExpanded} aria-controls={controls} onClick={onToggle} className={className}>
        {content}
      </button>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

function formatOutflow(value: number) {
  return value > 0 ? formatCurrency(-value) : formatCurrency(0);
}

function BreakdownValueLine({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={cn(
          "font-medium",
          tone === "positive" && "text-emerald-700",
          tone === "negative" && "text-rose-700",
          tone === "neutral" && "text-slate-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function AvailableCashBreakdownCard({ group }: { group: DashboardAvailableCashBreakdownGroup }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="font-medium text-slate-950">{group.label}</p>
      <div className="mt-3 space-y-2">
        <BreakdownValueLine
          label="Saldo anterior"
          value={formatCurrency(group.previousBalance)}
          tone={group.previousBalance >= 0 ? "positive" : "negative"}
        />
        <BreakdownValueLine label="Entradas do período" value={formatCurrency(group.income)} tone="positive" />
        <BreakdownValueLine label="Saídas pagas do período" value={formatOutflow(group.expenses)} tone="negative" />
        <BreakdownValueLine label="Guardado/reserva do período" value={formatOutflow(group.saved)} tone="negative" />
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <BreakdownValueLine
          label="Saldo disponível"
          value={formatCurrency(group.net)}
          tone={group.net >= 0 ? "positive" : "negative"}
        />
      </div>
    </div>
  );
}

export function CashAndCardSummaryCard({ summary }: CashAndCardSummaryCardProps) {
  const [cashDetailsOpen, setCashDetailsOpen] = useState(false);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  const projectedTone = summary.projectedAfterNextInvoice >= 0 ? "positive" : "warning";
  const hasFutureInvoices = summary.futureInvoiceMonthGroups.length > 0;
  const hasAvailableCashDetails = summary.availableCashBreakdown.people.length > 0;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-950">Resumo de caixa e cartão</p>
          <p className="mt-1 text-sm text-slate-500">
            Veja o caixa real, a próxima fatura e o impacto dos compromissos no cartão.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Saldo disponível hoje"
          value={summary.availableCash}
          tone="positive"
          helperText="Saldo anterior mais movimentações quitadas do período selecionado."
          isExpanded={cashDetailsOpen}
          controls="available-cash-details"
          onToggle={() => setCashDetailsOpen((current) => !current)}
        />
        <MetricCard
          label="Próxima fatura a pagar"
          value={summary.nextInvoiceTotal}
          tone="warning"
          helperText={
            summary.nextInvoiceMonthLabel
              ? `${summary.nextInvoiceMonthLabel} - vence ${summary.nextInvoiceDueDateLabel}`
              : "Nenhuma fatura pendente."
          }
          isExpanded={invoiceDetailsOpen}
          controls="next-invoice-details"
          onToggle={hasFutureInvoices ? () => setInvoiceDetailsOpen((current) => !current) : undefined}
        />
        <MetricCard
          label="Compromissos futuros no cartão"
          value={summary.futureCardCommitments}
          tone="neutral"
          helperText="Valor total ainda comprometido em cartões."
        />
        <MetricCard
          label="Saldo projetado"
          value={summary.projectedAfterNextInvoice}
          tone={projectedTone}
          helperText="Estimativa após quitar a próxima fatura."
        />
      </div>

      {cashDetailsOpen ? (
        <div id="available-cash-details" className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-950">Detalhamento do saldo disponível</p>
              <p className="mt-1 text-xs text-emerald-800">
                Saldo anterior somado às entradas do período, menos saídas pagas e reservas do período.
              </p>
            </div>
            <p className="text-sm font-semibold text-emerald-950">
              Total: {formatCurrency(summary.availableCashBreakdown.totals.net)}
            </p>
          </div>

          {!hasAvailableCashDetails ? (
            <div className="mt-3 rounded-2xl bg-white/80 px-4 py-4 text-sm text-slate-500">
              Nenhum lançamento quitado encontrado para compor o saldo disponível.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900">Por titular</p>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {summary.availableCashBreakdown.people.map((person) => (
                    <AvailableCashBreakdownCard key={person.id} group={person} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-sm font-medium text-slate-950">Total consolidado</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <BreakdownValueLine
                    label="Saldo anterior"
                    value={formatCurrency(summary.availableCashBreakdown.totals.previousBalance)}
                    tone={summary.availableCashBreakdown.totals.previousBalance >= 0 ? "positive" : "negative"}
                  />
                  <BreakdownValueLine
                    label="Entradas"
                    value={formatCurrency(summary.availableCashBreakdown.totals.income)}
                    tone="positive"
                  />
                  <BreakdownValueLine
                    label="Saídas"
                    value={formatOutflow(summary.availableCashBreakdown.totals.expenses)}
                    tone="negative"
                  />
                  <BreakdownValueLine
                    label="Guardado"
                    value={formatOutflow(summary.availableCashBreakdown.totals.saved)}
                    tone="negative"
                  />
                  <BreakdownValueLine
                    label="Saldo"
                    value={formatCurrency(summary.availableCashBreakdown.totals.net)}
                    tone={summary.availableCashBreakdown.totals.net >= 0 ? "positive" : "negative"}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {invoiceDetailsOpen && hasFutureInvoices ? (
        <div id="next-invoice-details" className="mt-4 space-y-4">
          {summary.nextInvoiceCards.length > 0 ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">Cartões da próxima fatura</p>
                  <p className="mt-1 text-xs text-amber-800">
                    {summary.nextInvoiceMonthLabel} • vence {summary.nextInvoiceDueDateLabel}
                  </p>
                </div>
                <p className="text-sm font-semibold text-amber-950">{formatCurrency(summary.nextInvoiceTotal)}</p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {summary.nextInvoiceCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{card.cardName}</p>
                      <p className="text-xs text-slate-500">Vence: {card.dueDateLabel}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(card.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Detalhes das faturas</p>
              <p className="mt-1 text-xs text-slate-500">Valores previstos em cartões ainda não quitados.</p>
            </div>
          </div>

          {summary.futureInvoiceMonthGroups.map((monthGroup) => (
            <div key={monthGroup.monthKey} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{monthGroup.monthLabel}</p>
                  <p className="text-sm text-slate-500">Total: {formatCurrency(monthGroup.total)}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {monthGroup.invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-2xl bg-white px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{invoice.cardName}</p>
                        <p className="mt-1 text-xs text-slate-500">Vence: {invoice.dueDateLabel}</p>
                      </div>
                      <p className="text-base font-semibold text-slate-950">{formatCurrency(invoice.amount)}</p>
                    </div>

                    <div className="mt-3 space-y-2">
                      {invoice.items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{item.description}</p>
                              {item.installmentLabel ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  Parcela: {item.installmentLabel} • Última parcela: {item.lastInstallmentLabel}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-slate-500">
                                  Fatura: {item.invoiceMonthLabel} • Vence: {item.dueDateLabel}
                                </p>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-950">{formatCurrency(item.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
