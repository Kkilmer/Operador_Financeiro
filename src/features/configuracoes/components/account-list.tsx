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
  initialBalance: number | null;
  creditLimit: number | null;
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

function formatDecimal(value: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return Number.isFinite(value)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    : "-";
}

function accountTypeLabel(type: AccountType) {
  switch (type) {
    case AccountType.CHECKING:
      return "Conta corrente";
    case AccountType.SAVINGS:
      return "Conta poupança";
    case AccountType.DIGITAL_WALLET:
      return "Carteira digital";
    case AccountType.CASH:
      return "Dinheiro físico";
    case AccountType.CREDIT_CARD:
      return "Cartão de crédito";
    case AccountType.DEBIT_CARD:
      return "Cartão de débito";
    case AccountType.MULTIPLE_CARD:
      return "Cartão múltiplo";
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
    <>
      <div className="grid gap-3 md:hidden">
        {accounts.map((account) => (
          <article key={account.id} className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900">{account.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{accountTypeLabel(account.type)}</p>
              </div>
              <Badge tone={account.isActive ? "emerald" : "slate"}>
                {account.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Titular</p>
                <p className="mt-1 font-medium text-slate-700">{account.ownerPerson?.name ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Saldo/Limite</p>
                <p className="mt-1 font-medium text-slate-700">Saldo: {formatDecimal(account.initialBalance)}</p>
                {account.creditLimit ? (
                  <p className="mt-1 font-medium text-slate-700">Limite: {formatDecimal(account.creditLimit)}</p>
                ) : null}
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Histórico</p>
                <p className="mt-1 font-medium text-slate-700">
                  {account._count.entries + account._count.purchases} vínculos
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit(account)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                >
                  Inativar
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden max-w-full overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-3 pr-4 font-medium">Nome</th>
            <th className="py-3 pr-4 font-medium">Titular</th>
            <th className="py-3 pr-4 font-medium">Tipo</th>
            <th className="py-3 pr-4 font-medium">Instituição</th>
            <th className="py-3 pr-4 font-medium">Saldo/Limite</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 pr-4 font-medium">Uso no histórico</th>
            <th className="py-3 font-medium">Ações</th>
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
                {account._count.entries + account._count.purchases} vínculos
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
    </>
  );
}
