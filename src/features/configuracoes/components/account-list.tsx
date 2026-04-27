"use client";

import { AccountType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { inactivateAccountAction } from "@/features/configuracoes/actions/inactivate-account";

type AccountListItem = {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: unknown;
  creditLimit: unknown;
  closingDay: number | null;
  dueDay: number | null;
  isActive: boolean;
  institution: {
    id: string;
    name: string;
  } | null;
  ownerPerson: {
    id: string;
    name: string;
  } | null;
  _count: {
    entries: number;
    purchases: number;
  };
};

type AccountListProps = {
  accounts: AccountListItem[];
  onEdit: (account: AccountListItem) => void;
};

function formatDecimal(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const normalized = typeof value === "object" && value && "toString" in value ? Number(value.toString()) : Number(value);

  return Number.isFinite(normalized)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(normalized)
    : "-";
}

function accountTypeLabel(type: AccountType) {
  switch (type) {
    case AccountType.CHECKING:
      return "Conta corrente";
    case AccountType.SAVINGS:
      return "Conta poupanca";
    case AccountType.DIGITAL_WALLET:
      return "Carteira digital";
    case AccountType.CASH:
      return "Dinheiro fisico";
    case AccountType.CREDIT_CARD:
      return "Cartao de credito";
    case AccountType.DEBIT_CARD:
      return "Cartao de debito";
    case AccountType.MULTIPLE_CARD:
      return "Cartao multiplo";
    case AccountType.INVESTMENT:
      return "Investimento";
    default:
      return "Outro";
  }
}

export function AccountList({ accounts, onEdit }: AccountListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-3 pr-4 font-medium">Nome</th>
            <th className="py-3 pr-4 font-medium">Titular</th>
            <th className="py-3 pr-4 font-medium">Tipo</th>
            <th className="py-3 pr-4 font-medium">Instituicao</th>
            <th className="py-3 pr-4 font-medium">Saldo/Limite</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 pr-4 font-medium">Uso no historico</th>
            <th className="py-3 font-medium">Acoes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {accounts.map((account) => (
            <tr key={account.id}>
              <td className="py-4 pr-4 font-medium text-slate-900">{account.name}</td>
              <td className="py-4 pr-4 text-slate-700">{account.ownerPerson?.name ?? "-"}</td>
              <td className="py-4 pr-4 text-slate-700">{accountTypeLabel(account.type)}</td>
              <td className="py-4 pr-4 text-slate-700">{account.institution?.name ?? "-"}</td>
              <td className="py-4 pr-4 text-slate-700">
                <div className="space-y-1">
                  <p>Saldo: {formatDecimal(account.initialBalance)}</p>
                  {account.creditLimit ? <p>Limite: {formatDecimal(account.creditLimit)}</p> : null}
                </div>
              </td>
              <td className="py-4 pr-4">
                <Badge tone={account.isActive ? "emerald" : "slate"}>
                  {account.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </td>
              <td className="py-4 pr-4 text-slate-700">
                {account._count.entries + account._count.purchases} vinculos
              </td>
              <td className="py-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(account)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Editar
                  </button>
                  {account.isActive ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await inactivateAccountAction(account.id);
                          router.refresh();
                        })
                      }
                      className="rounded-full border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                    >
                      Inativar
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

