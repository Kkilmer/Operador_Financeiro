import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { prisma } from "@/lib/prisma/client";

export async function GlobalQuickEntryFab() {
  const [people, accounts, categories, paymentMethods] = await Promise.all([
    prisma.person.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.financialAccount.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        ownerPerson: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
    prisma.paymentMethodOption.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, paymentMethod: true },
    }),
  ]);

  return (
    <FloatingActionButton
      people={people.map((person) => ({ id: person.id, label: person.name }))}
      accounts={accounts.map((account) => ({
        id: account.id,
        label: account.ownerPerson ? `${account.name} - ${account.ownerPerson.name}` : account.name,
      }))}
      categories={categories.map((category) => ({
        id: category.id,
        label: category.name,
        type: category.type,
      }))}
      paymentMethods={paymentMethods.map((paymentMethod) => ({
        id: paymentMethod.id,
        label: paymentMethod.name,
        paymentMethod: paymentMethod.paymentMethod,
      }))}
    />
  );
}
