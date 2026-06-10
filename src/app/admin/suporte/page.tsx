import { SupportTicketStatus, SupportTicketType } from "@prisma/client";

import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { AdminSupportTicketsTable } from "@/features/support/components/admin-support-tickets-table";
import { supportTicketStatusOptions, supportTicketTypeOptions } from "@/features/support/constants";
import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(date);
}

type AdminSupportPageProps = {
  searchParams: Promise<{
    type?: SupportTicketType | "ALL";
    status?: SupportTicketStatus | "ALL";
  }>;
};

export default async function AdminSupportPage({ searchParams }: AdminSupportPageProps) {
  await requireAdminUser();

  const { type = "ALL", status = "ALL" } = await searchParams;

  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(type !== "ALL" ? { type } : {}),
      ...(status !== "ALL" ? { status } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
      adminResponse: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Suporte</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Acompanhe as solicitações enviadas pelos usuários e devolva um retorno sem acessar os dados financeiros deles.
        </p>
      </div>

      <AdminSectionNav active="suporte" />

      <form className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Tipo</span>
          <select
            name="type"
            defaultValue={type}
            className="min-h-11 w-full rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="ALL">Todos</option>
            {supportTicketTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="min-h-11 w-full rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="ALL">Todos</option>
            {supportTicketStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="min-h-11 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Aplicar filtros
          </button>
        </div>
      </form>

      <AdminSupportTicketsTable
        tickets={tickets.map((ticket) => ({
          id: ticket.id,
          type: ticket.type,
          status: ticket.status,
          description: ticket.description,
          adminResponse: ticket.adminResponse,
          createdAtLabel: formatDate(ticket.createdAt),
          updatedAtLabel: formatDate(ticket.updatedAt),
          userName: ticket.user.name,
          userEmail: ticket.user.email,
        }))}
      />
    </main>
  );
}
