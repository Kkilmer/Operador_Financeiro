import { AdminUserRowActions } from "@/features/admin/components/admin-user-row-actions";

type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  isActive: boolean;
  role: "ADMIN" | "USER";
  createdAtLabel: string;
  lastLoginAtLabel: string;
};

type AdminUsersTableProps = {
  users: AdminUserListItem[];
};

function maskCpf(cpf: string | null) {
  if (!cpf) {
    return "Não informado";
  }

  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) {
    return "CPF inválido";
  }

  return `***.***.***-${digits.slice(-2)}`;
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
        Nenhum usuário encontrado com os filtros informados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:hidden">
        {users.map((user) => (
          <article key={user.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="break-words text-sm text-slate-600">{user.email}</p>
              </div>
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                  user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-700"
                }`}
              >
                {user.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">CPF</dt>
                <dd className="mt-1 text-slate-700">{maskCpf(user.cpf)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">Perfil</dt>
                <dd className="mt-1 text-slate-700">{user.role}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">Cadastro</dt>
                <dd className="mt-1 text-slate-700">{user.createdAtLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">Último acesso</dt>
                <dd className="mt-1 text-slate-700">{user.lastLoginAtLabel}</dd>
              </div>
            </dl>

            <AdminUserRowActions userId={user.id} isActive={user.isActive} />
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 bg-white md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3">Último acesso</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="align-top">
                <td className="px-4 py-4 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-4 text-slate-600">{user.email}</td>
                <td className="px-4 py-4 text-slate-600">{maskCpf(user.cpf)}</td>
                <td className="px-4 py-4 text-slate-600">{user.role}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {user.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">{user.createdAtLabel}</td>
                <td className="px-4 py-4 text-slate-600">{user.lastLoginAtLabel}</td>
                <td className="px-4 py-4">
                  <AdminUserRowActions userId={user.id} isActive={user.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
