import { PrismaClient as SqlitePrismaClient } from "@prisma/client";
import { PrismaClient as PostgresPrismaClient } from "../src/generated/postgres-client";

const sqlite = new SqlitePrismaClient();
const postgres = new PostgresPrismaClient();

async function assertTargetIsEmpty() {
  const counts = {
    users: await postgres.user.count(),
    sessions: await postgres.session.count(),
    people: await postgres.person.count(),
    institutions: await postgres.financialInstitution.count(),
    accounts: await postgres.financialAccount.count(),
    categories: await postgres.category.count(),
    paymentMethods: await postgres.paymentMethodOption.count(),
    entries: await postgres.financialEntry.count(),
    purchases: await postgres.installmentPurchase.count(),
    installments: await postgres.installment.count(),
  };

  const hasData = Object.values(counts).some((count) => count > 0);

  if (hasData) {
    throw new Error(
      `O PostgreSQL já possui dados. Esvazie o banco novo antes de migrar para evitar duplicação.\n${JSON.stringify(
        counts,
        null,
        2,
      )}`,
    );
  }
}

async function migrateUsersAndSessions() {
  const [users, sessions] = await Promise.all([
    sqlite.user.findMany({ orderBy: { createdAt: "asc" } }),
    sqlite.session.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (users.length > 0) {
    await postgres.user.createMany({
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  }

  if (sessions.length > 0) {
    await postgres.session.createMany({
      data: sessions.map((session) => ({
        id: session.id,
        token: session.token,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
    });
  }
}

async function migratePeople() {
  const people = await sqlite.person.findMany({ orderBy: { createdAt: "asc" } });

  if (people.length === 0) {
    return;
  }

  await postgres.person.createMany({
    data: people.map((person) => ({
      id: person.id,
      userId: person.userId,
      name: person.name,
      code: person.code,
      isActive: person.isActive,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    })),
  });
}

async function migrateInstitutions() {
  const institutions = await sqlite.financialInstitution.findMany({ orderBy: { createdAt: "asc" } });

  if (institutions.length === 0) {
    return;
  }

  await postgres.financialInstitution.createMany({
    data: institutions.map((institution) => ({
      id: institution.id,
      name: institution.name,
      shortName: institution.shortName,
      type: institution.type,
      isActive: institution.isActive,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
    })),
  });
}

async function migrateAccounts() {
  const accounts = await sqlite.financialAccount.findMany({ orderBy: { createdAt: "asc" } });

  if (accounts.length === 0) {
    return;
  }

  await postgres.financialAccount.createMany({
    data: accounts.map((account) => ({
      id: account.id,
      userId: account.userId,
      name: account.name,
      type: account.type,
      institutionId: account.institutionId,
      ownerPersonId: account.ownerPersonId,
      isShared: account.isShared,
      currency: account.currency,
      initialBalance: account.initialBalance,
      creditLimit: account.creditLimit,
      closingDay: account.closingDay,
      dueDay: account.dueDay,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    })),
  });
}

async function migrateCategories() {
  const categories = await sqlite.category.findMany({ orderBy: { createdAt: "asc" } });

  if (categories.length === 0) {
    return;
  }

  await postgres.category.createMany({
    data: categories.map((category) => ({
      id: category.id,
      userId: category.userId,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      parentCategoryId: category.parentCategoryId,
      isEssential: category.isEssential,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })),
  });
}

async function migratePaymentMethods() {
  const paymentMethods = await sqlite.paymentMethodOption.findMany({ orderBy: { createdAt: "asc" } });

  if (paymentMethods.length === 0) {
    return;
  }

  await postgres.paymentMethodOption.createMany({
    data: paymentMethods.map((paymentMethod) => ({
      id: paymentMethod.id,
      userId: paymentMethod.userId,
      name: paymentMethod.name,
      behavior: paymentMethod.behavior,
      paymentMethod: paymentMethod.paymentMethod,
      requiresInstallments: paymentMethod.requiresInstallments,
      immediateSettlement: paymentMethod.immediateSettlement,
      isActive: paymentMethod.isActive,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
    })),
  });
}

async function migrateEntries() {
  const entries = await sqlite.financialEntry.findMany({ orderBy: { createdAt: "asc" } });

  if (entries.length === 0) {
    return;
  }

  await postgres.financialEntry.createMany({
    data: entries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      type: entry.type,
      description: entry.description,
      amount: entry.amount,
      eventDate: entry.eventDate,
      competenceDate: entry.competenceDate,
      personId: entry.personId,
      accountId: entry.accountId,
      categoryId: entry.categoryId,
      paymentMethod: entry.paymentMethod,
      settlementStatus: entry.settlementStatus,
      frequencyProfile: entry.frequencyProfile,
      isInstallment: entry.isInstallment,
      notes: entry.notes,
      origin: entry.origin,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })),
  });
}

async function migrateInstallmentPurchases() {
  const purchases = await sqlite.installmentPurchase.findMany({ orderBy: { createdAt: "asc" } });

  if (purchases.length === 0) {
    return;
  }

  await postgres.installmentPurchase.createMany({
    data: purchases.map((purchase) => ({
      id: purchase.id,
      userId: purchase.userId,
      description: purchase.description,
      totalAmount: purchase.totalAmount,
      installmentCount: purchase.installmentCount,
      installmentAmount: purchase.installmentAmount,
      purchaseDate: purchase.purchaseDate,
      notes: purchase.notes,
      personId: purchase.personId,
      accountId: purchase.accountId,
      categoryId: purchase.categoryId,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    })),
  });
}

async function migrateInstallments() {
  const installments = await sqlite.installment.findMany({ orderBy: { createdAt: "asc" } });

  if (installments.length === 0) {
    return;
  }

  await postgres.installment.createMany({
    data: installments.map((installment) => ({
      id: installment.id,
      userId: installment.userId,
      installmentPurchaseId: installment.installmentPurchaseId,
      financialEntryId: installment.financialEntryId,
      number: installment.number,
      amount: installment.amount,
      dueDate: installment.dueDate,
      competenceDate: installment.competenceDate,
      status: installment.status,
      createdAt: installment.createdAt,
      updatedAt: installment.updatedAt,
    })),
  });
}

async function validateCounts() {
  const [source, target] = await Promise.all([
    Promise.all([
      sqlite.user.count(),
      sqlite.session.count(),
      sqlite.person.count(),
      sqlite.financialInstitution.count(),
      sqlite.financialAccount.count(),
      sqlite.category.count(),
      sqlite.paymentMethodOption.count(),
      sqlite.financialEntry.count(),
      sqlite.installmentPurchase.count(),
      sqlite.installment.count(),
    ]),
    Promise.all([
      postgres.user.count(),
      postgres.session.count(),
      postgres.person.count(),
      postgres.financialInstitution.count(),
      postgres.financialAccount.count(),
      postgres.category.count(),
      postgres.paymentMethodOption.count(),
      postgres.financialEntry.count(),
      postgres.installmentPurchase.count(),
      postgres.installment.count(),
    ]),
  ]);

  const labels = [
    "users",
    "sessions",
    "people",
    "institutions",
    "accounts",
    "categories",
    "paymentMethods",
    "entries",
    "purchases",
    "installments",
  ];

  const summary = labels.reduce<Record<string, { source: number; target: number }>>((acc, label, index) => {
    acc[label] = {
      source: source[index],
      target: target[index],
    };

    return acc;
  }, {});

  const mismatch = labels.find((label) => summary[label].source !== summary[label].target);

  if (mismatch) {
    throw new Error(`Contagem divergente após migração.\n${JSON.stringify(summary, null, 2)}`);
  }

  console.log("Migração concluída com contagens validadas.");
  console.log(JSON.stringify(summary, null, 2));
}

async function main() {
  await assertTargetIsEmpty();
  await migrateUsersAndSessions();
  await migratePeople();
  await migrateInstitutions();
  await migrateAccounts();
  await migrateCategories();
  await migratePaymentMethods();
  await migrateEntries();
  await migrateInstallmentPurchases();
  await migrateInstallments();
  await validateCounts();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  });
