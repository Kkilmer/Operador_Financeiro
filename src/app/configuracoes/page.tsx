import { SettingsPage } from "@/features/configuracoes/components/settings-page";
import { listAccounts } from "@/features/configuracoes/services/list-accounts";
import { listCategories } from "@/features/configuracoes/services/list-categories";
import { listPaymentMethodOptions } from "@/features/configuracoes/services/list-payment-method-options";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export default async function SettingsRoutePage() {
  const userId = await requireCurrentUserId();
  const [accounts, categories, paymentMethods, people] = await Promise.all([
    listAccounts(),
    listCategories(),
    listPaymentMethodOptions(),
    prisma.person.findMany({
      where: { userId, isActive: true },
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
