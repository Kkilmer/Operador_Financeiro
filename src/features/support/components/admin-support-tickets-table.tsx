import { AdminSupportTicketRowActions } from "@/features/support/components/admin-support-ticket-row-actions";
import { getSupportTicketStatusLabel, getSupportTicketTypeLabel } from "@/features/support/constants";

type AdminSupportTicketItem = {
  id: string;
  type: string;
  status: string;
  description: string;
  adminResponse: string | null;
  createdAtLabel: string;
  updatedAtLabel: string;
  userName: string;
  userEmail: string;
};

type AdminSupportTicketsTableProps = {
  tickets: AdminSupportTicketItem[];
};

export function AdminSupportTicketsTable({ tickets }: AdminSupportTicketsTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
        Nenhuma solicitação encontrada com esses filtros.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:hidden">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{ticket.userName}</p>
              <p className="break-words text-sm text-slate-600">{ticket.userEmail}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                {getSupportTicketTypeLabel(ticket.type)}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                {getSupportTicketStatusLabel(ticket.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <p>{ticket.description}</p>
              {ticket.adminResponse ? (
                <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Resposta atual: {ticket.adminResponse}
                </p>
              ) : null}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">Criado</dt>
                <dd className="mt-1 text-slate-700">{ticket.createdAtLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">Atualizado</dt>
                <dd className="mt-1 text-slate-700">{ticket.updatedAtLabel}</dd>
              </div>
            </dl>

            <AdminSupportTicketRowActions
              ticketId={ticket.id}
              status={ticket.status}
              adminResponse={ticket.adminResponse}
            />
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 bg-white md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Criado</th>
              <th className="px-4 py-3">Atualizado</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-900">{ticket.userName}</p>
                  <p className="text-slate-600">{ticket.userEmail}</p>
                </td>
                <td className="px-4 py-4 text-slate-600">{getSupportTicketTypeLabel(ticket.type)}</td>
                <td className="px-4 py-4 text-slate-600">{getSupportTicketStatusLabel(ticket.status)}</td>
                <td className="px-4 py-4 text-slate-700">
                  <div className="max-w-md space-y-2">
                    <p>{ticket.description}</p>
                    {ticket.adminResponse ? (
                      <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        Resposta atual: {ticket.adminResponse}
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600">{ticket.createdAtLabel}</td>
                <td className="px-4 py-4 text-slate-600">{ticket.updatedAtLabel}</td>
                <td className="px-4 py-4">
                  <AdminSupportTicketRowActions
                    ticketId={ticket.id}
                    status={ticket.status}
                    adminResponse={ticket.adminResponse}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
