import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { AdminUsersTable } from "@/features/admin/components/admin-users-table";
import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(date);
}

type AdminUsersPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = searchParams ? await searchParams : undefined;
  await requireAdminUser();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Usuários</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Gerencie o acesso ao sistema sem visualizar os dados financeiros privados de cada usuário.
        </p>
      </div>

      <AdminSectionNav active="usuarios" />

      {params?.status === "updated" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Usuário atualizado com sucesso.
        </div>
      ) : null}

      <AdminUsersTable
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          role: user.role,
          isActive: user.isActive,
          createdAtLabel: formatDate(user.createdAt),
          lastLoginAtLabel: user.lastLoginAt ? formatDate(user.lastLoginAt) : "Ainda não acessou",
        }))}
      />
    </main>
  );
}
