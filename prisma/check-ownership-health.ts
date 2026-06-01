import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

async function main() {
  const [
    peopleWithoutUser,
    accountsWithoutUser,
    categoriesWithoutUser,
    paymentMethodsWithoutUser,
    entriesWithoutUser,
    purchasesWithoutUser,
    installmentsWithoutUser,
    entryOwnershipRows,
    purchaseOwnershipRows,
    installmentOwnershipRows,
  ] = await Promise.all([
    prisma.person.count({ where: { userId: null } }),
    prisma.financialAccount.count({ where: { userId: null } }),
    prisma.category.count({ where: { userId: null } }),
    prisma.paymentMethodOption.count({ where: { userId: null } }),
    prisma.financialEntry.count({ where: { userId: null } }),
    prisma.installmentPurchase.count({ where: { userId: null } }),
    prisma.installment.count({ where: { userId: null } }),
    prisma.financialEntry.findMany({
      where: { userId: { not: null } },
      select: {
        id: true,
        userId: true,
        person: { select: { userId: true } },
        account: { select: { userId: true } },
        category: { select: { userId: true } },
      },
    }),
    prisma.installmentPurchase.findMany({
      where: { userId: { not: null } },
      select: {
        id: true,
        userId: true,
        person: { select: { userId: true } },
        account: { select: { userId: true } },
        category: { select: { userId: true } },
      },
    }),
    prisma.installment.findMany({
      where: { userId: { not: null } },
      select: {
        id: true,
        userId: true,
        installmentPurchase: { select: { userId: true } },
        financialEntry: { select: { userId: true } },
      },
    }),
  ]);

  const entryPersonMismatch = entryOwnershipRows.filter(
    (row) => row.person.userId != null && row.person.userId !== row.userId,
  ).length;
  const entryAccountMismatch = entryOwnershipRows.filter(
    (row) => row.account.userId != null && row.account.userId !== row.userId,
  ).length;
  const entryCategoryMismatch = entryOwnershipRows.filter(
    (row) => row.category?.userId != null && row.category.userId !== row.userId,
  ).length;
  const purchasePersonMismatch = purchaseOwnershipRows.filter(
    (row) => row.person.userId != null && row.person.userId !== row.userId,
  ).length;
  const purchaseAccountMismatch = purchaseOwnershipRows.filter(
    (row) => row.account.userId != null && row.account.userId !== row.userId,
  ).length;
  const purchaseCategoryMismatch = purchaseOwnershipRows.filter(
    (row) => row.category.userId != null && row.category.userId !== row.userId,
  ).length;
  const installmentPurchaseMismatch = installmentOwnershipRows.filter(
    (row) => row.installmentPurchase.userId != null && row.installmentPurchase.userId !== row.userId,
  ).length;
  const installmentEntryMismatch = installmentOwnershipRows.filter(
    (row) => row.financialEntry.userId != null && row.financialEntry.userId !== row.userId,
  ).length;

  const summary = {
    nullUserId: {
      person: peopleWithoutUser,
      financialAccount: accountsWithoutUser,
      category: categoriesWithoutUser,
      paymentMethodOption: paymentMethodsWithoutUser,
      financialEntry: entriesWithoutUser,
      installmentPurchase: purchasesWithoutUser,
      installment: installmentsWithoutUser,
    },
    relationshipReview: {
      note: "Estas contagens devem ser auditadas junto com a amostragem detalhada. Quando o total estiver em zero, a migration para NOT NULL fica segura.",
      counters: {
        entryPersonMismatch,
        entryAccountMismatch,
        entryCategoryMismatch,
        purchasePersonMismatch,
        purchaseAccountMismatch,
        purchaseCategoryMismatch,
        installmentPurchaseMismatch,
        installmentEntryMismatch,
      },
    },
  };

  const [
    sampleEntries,
    samplePurchases,
    sampleInstallments,
  ] = await Promise.all([
    prisma.financialEntry.findMany({
      where: {
        OR: [{ userId: null }],
      },
      select: {
        id: true,
        description: true,
        userId: true,
        personId: true,
        accountId: true,
        categoryId: true,
      },
      take: 10,
      orderBy: { createdAt: "asc" },
    }),
    prisma.installmentPurchase.findMany({
      where: {
        OR: [{ userId: null }],
      },
      select: {
        id: true,
        description: true,
        userId: true,
        personId: true,
        accountId: true,
        categoryId: true,
      },
      take: 10,
      orderBy: { createdAt: "asc" },
    }),
    prisma.installment.findMany({
      where: {
        OR: [{ userId: null }],
      },
      select: {
        id: true,
        userId: true,
        installmentPurchaseId: true,
        financialEntryId: true,
        number: true,
      },
      take: 10,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    samples: {
      financialEntries: sampleEntries,
      installmentPurchases: samplePurchases,
      installments: sampleInstallments,
    },
  };

  const reportDir = path.resolve(process.cwd(), "docs", "reports");
  const reportPath = path.join(reportDir, "ownership-health.latest.json");
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify({ reportPath, ...report }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
