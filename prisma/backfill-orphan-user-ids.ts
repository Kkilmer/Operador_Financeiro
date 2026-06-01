import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

function isApplyMode() {
  return process.env.APPLY === "true";
}

async function resolveTargetUserId() {
  const targetEmail = process.env.TARGET_ADMIN_EMAIL?.trim().toLowerCase() || "kevin@operador.local";

  const user = await prisma.user.findFirst({
    where: {
      email: targetEmail,
      role: UserRole.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw new Error(`Não foi possível localizar um admin ativo com o e-mail ${targetEmail}.`);
  }

  return user;
}

async function main() {
  const apply = isApplyMode();
  const targetUser = await resolveTargetUserId();

  const counts = {
    people: await prisma.person.count({ where: { userId: null } }),
    accounts: await prisma.financialAccount.count({ where: { userId: null } }),
    categories: await prisma.category.count({ where: { userId: null } }),
    paymentMethods: await prisma.paymentMethodOption.count({ where: { userId: null } }),
    entries: await prisma.financialEntry.count({ where: { userId: null } }),
    purchases: await prisma.installmentPurchase.count({ where: { userId: null } }),
    installments: await prisma.installment.count({ where: { userId: null } }),
  };

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        targetUser,
        nullUserIdBefore: counts,
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log(
      "Dry-run concluído. Para aplicar o backfill de órfãos, rode com APPLY=true e opcionalmente TARGET_ADMIN_EMAIL=<email-do-admin>.",
    );
    return;
  }

  const [people, accounts, categories, paymentMethods, entries, purchases, installments] = await prisma.$transaction([
    prisma.person.updateMany({
      where: { userId: null },
      data: { userId: targetUser.id },
    }),
    prisma.financialAccount.updateMany({
      where: { userId: null },
      data: { userId: targetUser.id },
    }),
    prisma.category.updateMany({
      where: { userId: null },
      data: { userId: targetUser.id },
    }),
    prisma.paymentMethodOption.updateMany({
      where: { userId: null },
      data: { userId: targetUser.id },
    }),
    prisma.financialEntry.updateMany({
      where: { userId: null },
      data: { userId: targetUser.id },
    }),
    prisma.installmentPurchase.updateMany({
      where: { userId: null },
      data: { userId: targetUser.id },
    }),
    prisma.installment.updateMany({
      where: { userId: null },
      data: { userId: targetUser.id },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        appliedTo: targetUser.email,
        updated: {
          people: people.count,
          accounts: accounts.count,
          categories: categories.count,
          paymentMethods: paymentMethods.count,
          entries: entries.count,
          purchases: purchases.count,
          installments: installments.count,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
