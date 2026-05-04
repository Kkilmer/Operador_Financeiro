import { notFound } from "next/navigation";

import { FinancialEntryEditForm } from "@/features/lancamentos/components/financial-entry-edit-form";
import { prisma } from "@/lib/prisma/client";

type EditFinancialEntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default async function EditFinancialEntryPage({ params }: EditFinancialEntryPageProps) {
  const { id } = await params;

  const entry = await prisma.financialEntry.findUnique({
    where: { id },
    include: {
      installment: true,
      person: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          isActive: true,
          ownerPerson: {
            select: {
              name: true,
            },
          },
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
        },
      },
    },
  });

  if (!entry) {
    notFound();
  }

  const categoryWhere =
    entry.categoryId != null
      ? {
          OR: [{ isActive: true }, { id: entry.categoryId }],
        }
      : { isActive: true };

  const [people, accounts, categories, paymentMethods] = await Promise.all([
    prisma.person.findMany({
      where: {
        OR: [{ isActive: true }, { id: entry.personId }],
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true },
    }),
    prisma.financialAccount.findMany({
      where: {
        OR: [{ isActive: true }, { id: entry.accountId }],
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
        ownerPerson: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      where: categoryWhere,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, type: true, isActive: true },
    }),
    prisma.paymentMethodOption.findMany({
      where: {
        OR: [{ isActive: true }, { paymentMethod: entry.paymentMethod }],
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, paymentMethod: true, isActive: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <FinancialEntryEditForm
        people={people.map((person) => ({
          id: person.id,
          label: person.isActive ? person.name : `${person.name} (oculto)`,
        }))}
        accounts={accounts.map((account) => ({
          id: account.id,
          label: account.isActive
            ? account.ownerPerson
              ? `${account.name} - ${account.ownerPerson.name}`
              : account.name
            : account.ownerPerson
              ? `${account.name} - ${account.ownerPerson.name} (oculto)`
              : `${account.name} (oculto)`,
        }))}
        categories={categories.map((category) => ({
          id: category.id,
          label: category.isActive ? category.name : `${category.name} (oculta)`,
          type: category.type,
        }))}
        paymentMethods={paymentMethods.map((paymentMethod) => ({
          id: paymentMethod.id,
          label: paymentMethod.isActive ? paymentMethod.name : `${paymentMethod.name} (oculta)`,
          paymentMethod: paymentMethod.paymentMethod,
        }))}
        initialValues={{
          id: entry.id,
          description: entry.description,
          amount: Number(entry.amount),
          eventDate: formatDateInputValue(entry.eventDate),
          type: entry.type,
          personId: entry.personId,
          accountId: entry.accountId,
          categoryId: entry.categoryId ?? "",
          paymentMethod: entry.paymentMethod,
          settlementStatus: entry.settlementStatus,
          frequencyProfile: entry.frequencyProfile,
          notes: entry.notes ?? "",
          isInstallmentEntry: Boolean(entry.installment),
        }}
      />
    </main>
  );
}
