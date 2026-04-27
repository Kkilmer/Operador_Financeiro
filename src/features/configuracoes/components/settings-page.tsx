import { AccountSettingsSection } from "@/features/configuracoes/components/account-settings-section";
import { CategorySettingsSection } from "@/features/configuracoes/components/category-settings-section";
import { PaymentMethodSettingsSection } from "@/features/configuracoes/components/payment-method-settings-section";

type SettingsPageProps = {
  accounts: Awaited<ReturnType<typeof import("@/features/configuracoes/services/list-accounts").listAccounts>>;
  categories: Awaited<ReturnType<typeof import("@/features/configuracoes/services/list-categories").listCategories>>;
  people: { id: string; name: string }[];
  paymentMethods: Awaited<
    ReturnType<typeof import("@/features/configuracoes/services/list-payment-method-options").listPaymentMethodOptions>
  >;
};

export function SettingsPage({ accounts, categories, people, paymentMethods }: SettingsPageProps) {
  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-ink-950 px-6 py-6 text-white xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Configuracoes</p>
          <h1 className="mt-2 text-3xl font-semibold">Base do app</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Gerencie categorias e formas de pagamento sem apagar historico financeiro.
          </p>
        </div>
      </section>

      <div className="grid gap-6">
        <AccountSettingsSection accounts={accounts} people={people} />
        <CategorySettingsSection categories={categories} />
        <PaymentMethodSettingsSection paymentMethods={paymentMethods} />
      </div>
    </main>
  );
}
