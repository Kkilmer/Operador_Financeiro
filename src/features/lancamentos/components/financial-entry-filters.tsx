import {
  EntryFrequencyProfile,
  EntryType,
  PaymentMethod,
  SettlementStatus,
} from "@prisma/client";
import Link from "next/link";

import { FinancialEntryListFilters } from "@/features/lancamentos/services/list-financial-entries";
import { getPaymentMethodLabel } from "@/features/lancamentos/utils/financial-entry-presentations";

type FilterOption = {
  id: string;
  label: string;
};

type PaymentMethodFilterOption = FilterOption & {
  paymentMethod: PaymentMethod;
};

type FinancialEntryFiltersProps = {
  selectedMonth: string;
  filters: FinancialEntryListFilters;
  people: FilterOption[];
  accounts: FilterOption[];
  categories: FilterOption[];
  paymentMethods: PaymentMethodFilterOption[];
};

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700"
      >
        {children}
      </select>
    </label>
  );
}

export function FinancialEntryFilters({
  selectedMonth,
  filters,
  people,
  accounts,
  categories,
  paymentMethods,
}: FinancialEntryFiltersProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
        <p className="text-sm text-slate-500">
          Refine as movimentações do mês sem misturar dados de outros usuários.
        </p>
      </div>

      <form method="get" className="space-y-4">
        <input type="hidden" name="month" value={selectedMonth} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Status"
            name="entryStatus"
            defaultValue={filters.settlementStatus}
          >
            <option value="">Todos</option>
            <option value={SettlementStatus.SETTLED}>Pago/Recebido</option>
            <option value={SettlementStatus.PENDING}>Pendente</option>
          </SelectField>

          <SelectField label="Tipo" name="type" defaultValue={filters.type}>
            <option value="">Todos</option>
            <option value={EntryType.INCOME}>Entrada</option>
            <option value={EntryType.EXPENSE}>Saída</option>
            <option value={EntryType.SAVED}>Guardado/Poupança</option>
          </SelectField>

          <SelectField
            label="Recorrência"
            name="recurrence"
            defaultValue={filters.recurrence}
          >
            <option value="">Todos</option>
            <option value={EntryFrequencyProfile.FIXED}>Fixos</option>
            <option value={EntryFrequencyProfile.VARIABLE}>Variáveis/Pontuais</option>
          </SelectField>

          <SelectField
            label="Parcelamento"
            name="installment"
            defaultValue={
              typeof filters.isInstallment === "boolean"
                ? filters.isInstallment
                  ? "parcelados"
                  : "nao-parcelados"
                : ""
            }
          >
            <option value="">Todos</option>
            <option value="parcelados">Parcelados</option>
            <option value="nao-parcelados">Não parcelados</option>
          </SelectField>

          <SelectField label="Conta/Cartão" name="accountId" defaultValue={filters.accountId}>
            <option value="">Todos</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Forma de pagamento"
            name="paymentMethod"
            defaultValue={filters.paymentMethod}
          >
            <option value="">Todos</option>
            {paymentMethods.map((paymentMethod) => (
              <option key={paymentMethod.id} value={paymentMethod.paymentMethod}>
                {paymentMethod.label || getPaymentMethodLabel(paymentMethod.paymentMethod)}
              </option>
            ))}
          </SelectField>

          <SelectField label="Categoria" name="categoryId" defaultValue={filters.categoryId}>
            <option value="">Todos</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </SelectField>

          <SelectField label="Pessoa/Titular" name="personId" defaultValue={filters.personId}>
            <option value="">Todos</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="min-h-11 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            Aplicar filtros
          </button>
          <Link
            href={`/lancamentos?month=${selectedMonth}`}
            className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpar filtros
          </Link>
        </div>
      </form>
    </section>
  );
}
