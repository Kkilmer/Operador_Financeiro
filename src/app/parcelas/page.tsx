import { EntryType, SettlementStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { EntryStatusCell } from "@/features/lancamentos/components/entry-status-cell";
import { listInstallmentCommitments } from "@/features/parcelas/services/list-installment-commitments";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";

type InstallmentsPageProps = {
  searchParams?: Promise<{
    month?: string;
    personId?: string;
    status?: "all" | "pending" | "paid";
  }>;
};

export default async function InstallmentsPage({ searchParams }: InstallmentsPageProps) {
  const params = (searchParams ? await searchParams : undefined) ?? {};
  const userId = await requireCurrentUserId();
  const [people, commitments] = await Promise.all([
    prisma.person.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    listInstallmentCommitments({
      month: params.month,
      personId: params.personId,
      status: params.status,
    }),
  ]);

  const referenceDate = new Date(`${commitments.referenceMonth}-01T00:00:00`);

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Parcelas</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Compromissos de {formatMonthYear(referenceDate)}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Acompanhe parcelas do mês, o que já foi pago e o que ainda está pendente.
          </p>
        </div>

        <form method="get" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
          <label className="flex min-w-0 flex-col gap-2 text-sm">
            <span className="font-medium text-slate-600">Mês</span>
            <input
              type="month"
              name="month"
              defaultValue={commitments.filters.month}
              className="w-full min-w-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-2 text-sm">
            <span className="font-medium text-slate-600">Pessoa</span>
            <select
              name="personId"
              defaultValue={commitments.filters.personId}
              className="w-full min-w-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700"
            >
              <option value="">Todas</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 flex-col gap-2 text-sm">
            <span className="font-medium text-slate-600">Status</span>
            <select
              name="status"
              defaultValue={commitments.filters.status}
              className="w-full min-w-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="paid">Pagos</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Total de compromissos" description={`${commitments.items.length} parcela(s) no mês`}>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(commitments.summary.totalAmount)}</p>
        </SectionCard>

        <SectionCard title="Total pendente" description={`${commitments.summary.pendingCount} pendente(s)`}>
          <p className="text-2xl font-semibold text-amber-700">{formatCurrency(commitments.summary.totalPending)}</p>
        </SectionCard>

        <SectionCard title="Total pago" description={`${commitments.summary.paidCount} paga(s)`}>
          <p className="text-2xl font-semibold text-emerald-700">{formatCurrency(commitments.summary.totalPaid)}</p>
        </SectionCard>
      </section>

      <SectionCard
        title="Parcelas do mês"
        description="Cada linha mostra a parcela, o cartão ou conta usado, a categoria e o status atual."
      >
        {commitments.items.length === 0 ? (
          <EmptyState
            title="Nenhuma parcela neste período"
            description="Quando houver compras parceladas no mês filtrado, elas aparecerão aqui com status, pessoa e valor."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-3 pr-4 font-medium">Descrição</th>
                  <th className="py-3 pr-4 font-medium">Pessoa</th>
                  <th className="py-3 pr-4 font-medium">Conta / cartão</th>
                  <th className="py-3 pr-4 font-medium">Categoria</th>
                  <th className="py-3 pr-4 font-medium">Parcela</th>
                  <th className="py-3 pr-4 font-medium">Vencimento</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-0 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commitments.items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="py-4 pr-4">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{item.description}</p>
                        {item.notes ? <p className="text-xs text-slate-500">{item.notes}</p> : null}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-slate-700">{item.personName}</td>
                    <td className="py-4 pr-4 text-slate-700">{item.accountName}</td>
                    <td className="py-4 pr-4 text-slate-700">{item.categoryName}</td>
                    <td className="py-4 pr-4">
                      <Badge tone="slate">{item.installmentLabel}</Badge>
                    </td>
                    <td className="py-4 pr-4 text-slate-700">{item.dueDateLabel}</td>
                    <td className="py-4 pr-4">
                      <EntryStatusCell
                        entryId={item.financialEntryId}
                        type={EntryType.EXPENSE}
                        settlementStatus={
                          item.status === "paid" ? SettlementStatus.SETTLED : SettlementStatus.PENDING
                        }
                      />
                    </td>
                    <td className="py-4 pr-0 font-semibold text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </main>
  );
}
