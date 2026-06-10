"use client";

import { AccountType } from "@prisma/client";
import { useMemo, useState } from "react";

import { AccountForm } from "@/features/configuracoes/components/account-form";
import { AccountList } from "@/features/configuracoes/components/account-list";

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

type PersonOption = {
  id: string;
  name: string;
};

type AccountSettingsSectionProps = {
  accounts: AccountListItem[];
  people: PersonOption[];
};

export function AccountSettingsSection({ accounts, people }: AccountSettingsSectionProps) {
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const editingAccount = useMemo(
    () => accounts.find((account) => account.id === editingAccountId) ?? null,
    [accounts, editingAccountId],
  );

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-900">Contas e cartões</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie as origens de dinheiro e os cartões usados nos lançamentos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingAccountId("new")}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 sm:w-auto"
        >
          Adicionar conta ou cartão
        </button>
      </div>

      {editingAccountId ? (
        <div className="mb-5">
          <AccountForm
            people={people}
            initialValues={
              editingAccountId === "new"
                ? null
                : editingAccount
                ? {
                    id: editingAccount.id,
                    name: editingAccount.name,
                    institutionName: editingAccount.institution?.name ?? null,
                    ownerPersonId: editingAccount.ownerPerson?.id ?? "",
                    type: editingAccount.type,
                    initialBalance: editingAccount.initialBalance,
                    creditLimit: editingAccount.creditLimit,
                    closingDay: editingAccount.closingDay,
                    dueDay: editingAccount.dueDay,
                    isActive: editingAccount.isActive,
                  }
                : null
            }
            onCancel={() => setEditingAccountId(null)}
          />
        </div>
      ) : null}

      <AccountList accounts={accounts} onEdit={(account) => setEditingAccountId(account.id)} />
    </section>
  );
}
