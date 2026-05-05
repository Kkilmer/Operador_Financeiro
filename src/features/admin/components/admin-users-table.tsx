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
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
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
  );
}
