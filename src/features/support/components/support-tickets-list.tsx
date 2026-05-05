import { getSupportTicketStatusLabel, getSupportTicketTypeLabel } from "@/features/support/constants";

type SupportTicketListItem = {
  id: string;
  type: string;
  status: string;
  description: string;
  adminResponse: string | null;
  createdAtLabel: string;
  updatedAtLabel: string;
};

type SupportTicketsListProps = {
  tickets: SupportTicketListItem[];
  emptyMessage: string;
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-amber-50 text-amber-700";
    case "IN_REVIEW":
      return "bg-sky-50 text-sky-700";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function SupportTicketsList({ tickets, emptyMessage }: SupportTicketsListProps) {
  if (tickets.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
        {emptyMessage}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {getSupportTicketTypeLabel(ticket.type)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(ticket.status)}`}>
                  {getSupportTicketStatusLabel(ticket.status)}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-700">{ticket.description}</p>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p>Criado em {ticket.createdAtLabel}</p>
              <p>Atualizado em {ticket.updatedAtLabel}</p>
            </div>
          </div>

          {ticket.adminResponse ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resposta do admin</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{ticket.adminResponse}</p>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
