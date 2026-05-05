import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.INITIAL_USER_NAME?.trim() || "Kevin";
  const email = process.env.INITIAL_USER_EMAIL?.trim().toLowerCase() || "kevin@operador.local";
  const password = process.env.INITIAL_USER_PASSWORD?.trim() || "Kevin123!";

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
      },
    }));

  const [people, accounts, categories, paymentMethods, entries, purchases, installments] = await Promise.all([
    prisma.person.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    }),
    prisma.financialAccount.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    }),
    prisma.category.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    }),
    prisma.paymentMethodOption.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    }),
    prisma.financialEntry.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    }),
    prisma.installmentPurchase.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    }),
    prisma.installment.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    }),
  ]);

  console.log("Backfill concluído com sucesso.");
  console.log(`Usuário inicial: ${user.name} <${user.email}>`);
  console.log(`Senha temporária: ${existingUser ? "(mantida a senha existente)" : password}`);
  console.log(
    JSON.stringify(
      {
        people: people.count,
        accounts: accounts.count,
        categories: categories.count,
        paymentMethods: paymentMethods.count,
        entries: entries.count,
        purchases: purchases.count,
        installments: installments.count,
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
