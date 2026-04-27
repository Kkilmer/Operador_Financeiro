import { SettingsPage } from "@/features/configuracoes/components/settings-page";
import { listAccounts } from "@/features/configuracoes/services/list-accounts";
import { listCategories } from "@/features/configuracoes/services/list-categories";
import { listPaymentMethodOptions } from "@/features/configuracoes/services/list-payment-method-options";
import { prisma } from "@/lib/prisma/client";

export default async function SettingsRoutePage() {
  const [accounts, categories, paymentMethods, people] = await Promise.all([
    listAccounts(),
    listCategories(),
    listPaymentMethodOptions(),
    prisma.person.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <SettingsPage
      accounts={accounts}
      categories={categories}
      people={people}
      paymentMethods={paymentMethods}
    />
  );
}
