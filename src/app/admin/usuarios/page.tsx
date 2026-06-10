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
    q?: string;
    status?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = searchParams ? await searchParams : undefined;
  await requireAdminUser();
  const search = params?.q?.trim() ?? "";
  const cpfSearch = search.replace(/\D/g, "");

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search.toLowerCase(), mode: "insensitive" } },
            ...(cpfSearch ? [{ cpf: { contains: cpfSearch } }] : []),
          ],
        }
      : undefined,
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

      <form
        method="get"
        className="grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-end"
      >
        <label className="min-w-0 space-y-2">
          <span className="block text-sm font-medium text-slate-700">Pesquisar usuário</span>
          <input
            name="q"
            defaultValue={search}
            placeholder="Nome, e-mail ou CPF"
            className="min-h-11 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Pesquisar
        </button>
        {search ? (
          <a
            href="/admin/usuarios"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpar
          </a>
        ) : null}
      </form>

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
