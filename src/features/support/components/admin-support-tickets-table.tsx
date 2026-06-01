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
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
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
  );
}
