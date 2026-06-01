import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { SupportTicketForm } from "@/features/support/components/support-ticket-form";
import { SupportTicketsList } from "@/features/support/components/support-tickets-list";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(date);
}

export default async function SupportPage() {
  const user = await requireCurrentUser();

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
      adminResponse: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Suporte</p>
        <h1 className="text-3xl font-semibold text-slate-900">Solicitações</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Registre melhorias, bugs ou uma conversa direta com o administrador. Você acompanha apenas o que enviou.
        </p>
      </div>

      <SupportTicketForm />

      <SupportTicketsList
        emptyMessage="Você ainda não enviou nenhuma solicitação."
        tickets={tickets.map((ticket) => ({
          id: ticket.id,
          type: ticket.type,
          status: ticket.status,
          description: ticket.description,
          adminResponse: ticket.adminResponse,
          createdAtLabel: formatDate(ticket.createdAt),
          updatedAtLabel: formatDate(ticket.updatedAt),
        }))}
      />
    </main>
  );
}
