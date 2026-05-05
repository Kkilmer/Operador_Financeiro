import {
  AccountType,
  CategoryType,
  InstitutionType,
  PaymentMethod,
  PaymentMethodBehavior,
  PrismaClient,
} from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const defaultUser =
    (await prisma.user.findUnique({
      where: { email: "kevin@operador.local" },
    })) ??
    (await prisma.user.create({
      data: {
        name: "Kevin",
        email: "kevin@operador.local",
        passwordHash: await hashPassword("Kevin123!"),
      },
    }));

  const kevin =
    (await prisma.person.findFirst({
      where: { userId: defaultUser.id, code: "kevin" },
    })) ??
    (await prisma.person.create({
      data: { userId: defaultUser.id, name: "Kevin", code: "kevin" },
    }));

  const isabelle =
    (await prisma.person.findFirst({
      where: { userId: defaultUser.id, code: "isabelle" },
    })) ??
    (await prisma.person.create({
      data: { userId: defaultUser.id, name: "Isabelle", code: "isabelle" },
    }));

  const nubank = await prisma.financialInstitution.upsert({
    where: { name_type: { name: "Nubank", type: InstitutionType.BANK } },
    update: {},
    create: { name: "Nubank", shortName: "Nu", type: InstitutionType.BANK },
  });

  const inter = await prisma.financialInstitution.upsert({
    where: { name_type: { name: "Inter", type: InstitutionType.BANK } },
    update: {},
    create: { name: "Inter", shortName: "Inter", type: InstitutionType.BANK },
  });

  const wallet = await prisma.financialInstitution.upsert({
    where: { name_type: { name: "Dinheiro", type: InstitutionType.OTHER } },
    update: {},
    create: { name: "Dinheiro", shortName: "Cash", type: InstitutionType.OTHER },
  });

  const accounts = [
    {
      name: "Conta Nubank Kevin",
      type: AccountType.CHECKING,
      institutionId: nubank.id,
      ownerPersonId: kevin.id,
      isShared: false,
      initialBalance: 0,
      creditLimit: null,
      closingDay: null,
      dueDay: null,
    },
    {
      name: "Cartao Nubank Kevin",
      type: AccountType.CREDIT_CARD,
      institutionId: nubank.id,
      ownerPersonId: kevin.id,
      isShared: false,
      initialBalance: 0,
      creditLimit: 3000,
      closingDay: 20,
      dueDay: 27,
    },
    {
      name: "Conta Inter Isabelle",
      type: AccountType.CHECKING,
      institutionId: inter.id,
      ownerPersonId: isabelle.id,
      isShared: false,
      initialBalance: 0,
      creditLimit: null,
      closingDay: null,
      dueDay: null,
    },
    {
      name: "Carteira",
      type: AccountType.CASH,
      institutionId: wallet.id,
      ownerPersonId: kevin.id,
      isShared: false,
      initialBalance: 0,
      creditLimit: null,
      closingDay: null,
      dueDay: null,
    },
  ];

  for (const account of accounts) {
    const existing = await prisma.financialAccount.findFirst({
      where: {
        name: account.name,
        userId: defaultUser.id,
        ownerPersonId: account.ownerPersonId,
      },
    });

    if (!existing) {
      await prisma.financialAccount.create({
        data: {
          ...account,
          userId: defaultUser.id,
        },
      });
    } else {
      await prisma.financialAccount.update({
        where: { id: existing.id },
        data: {
          institutionId: account.institutionId,
          type: account.type,
          ownerPersonId: account.ownerPersonId,
          isShared: account.isShared,
          initialBalance: account.initialBalance,
          creditLimit: account.creditLimit,
          closingDay: account.closingDay,
          dueDay: account.dueDay,
          userId: defaultUser.id,
          isActive: true,
        },
      });
    }
  }

  const categories = [
    { name: "Salario", type: CategoryType.INCOME },
    { name: "Freelas", type: CategoryType.INCOME },
    { name: "Mercado", type: CategoryType.EXPENSE },
    { name: "Moradia", type: CategoryType.EXPENSE },
    { name: "Saude", type: CategoryType.EXPENSE },
    { name: "IFood/restaurante", type: CategoryType.EXPENSE },
    { name: "Desenvolvimento", type: CategoryType.EXPENSE },
    { name: "Transporte", type: CategoryType.EXPENSE },
    { name: "Assinaturas", type: CategoryType.EXPENSE },
    { name: "Lazer", type: CategoryType.EXPENSE },
    { name: "Roupa", type: CategoryType.EXPENSE },
    { name: "Beleza", type: CategoryType.EXPENSE },
    { name: "Presentes", type: CategoryType.EXPENSE },
    { name: "Despesas eventuais", type: CategoryType.EXPENSE },
    { name: "Poupança", type: CategoryType.INVESTMENT },
    { name: "Reserva de emergência", type: CategoryType.INVESTMENT },
    { name: "Investimento", type: CategoryType.INVESTMENT },
    { name: "Renda fixa", type: CategoryType.INVESTMENT },
    { name: "Outro", type: CategoryType.INVESTMENT },
    { name: "Outro", type: CategoryType.BOTH },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: {
        name: category.name,
        type: category.type,
        parentCategoryId: null,
        userId: defaultUser.id,
      },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          ...category,
          userId: defaultUser.id,
        },
      });
    }
  }

  const paymentMethods = [
    {
      name: "Pix",
      behavior: PaymentMethodBehavior.PIX,
      paymentMethod: PaymentMethod.PIX,
      requiresInstallments: false,
      immediateSettlement: true,
    },
    {
      name: "Debito",
      behavior: PaymentMethodBehavior.DEBITO,
      paymentMethod: PaymentMethod.DEBIT,
      requiresInstallments: false,
      immediateSettlement: true,
    },
    {
      name: "Credito a vista",
      behavior: PaymentMethodBehavior.CREDITO_A_VISTA,
      paymentMethod: PaymentMethod.CREDIT_SINGLE,
      requiresInstallments: false,
      immediateSettlement: false,
    },
    {
      name: "Credito parcelado",
      behavior: PaymentMethodBehavior.CREDITO_PARCELADO,
      paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
      requiresInstallments: true,
      immediateSettlement: false,
    },
    {
      name: "Dinheiro",
      behavior: PaymentMethodBehavior.DINHEIRO,
      paymentMethod: PaymentMethod.CASH,
      requiresInstallments: false,
      immediateSettlement: true,
    },
    {
      name: "Transferencia",
      behavior: PaymentMethodBehavior.TRANSFERENCIA,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      requiresInstallments: false,
      immediateSettlement: true,
    },
    {
      name: "Boleto",
      behavior: PaymentMethodBehavior.BOLETO,
      paymentMethod: PaymentMethod.BOLETO,
      requiresInstallments: false,
      immediateSettlement: false,
    },
    {
      name: "Outro",
      behavior: PaymentMethodBehavior.OUTRO,
      paymentMethod: PaymentMethod.OTHER,
      requiresInstallments: false,
      immediateSettlement: false,
    },
  ];

  for (const paymentMethod of paymentMethods) {
    const existing = await prisma.paymentMethodOption.findFirst({
      where: {
        userId: defaultUser.id,
        paymentMethod: paymentMethod.paymentMethod,
      },
    });

    if (existing) {
      await prisma.paymentMethodOption.update({
        where: { id: existing.id },
        data: {
          name: paymentMethod.name,
          behavior: paymentMethod.behavior,
          requiresInstallments: paymentMethod.requiresInstallments,
          immediateSettlement: paymentMethod.immediateSettlement,
          isActive: true,
          userId: defaultUser.id,
        },
      });
    } else {
      await prisma.paymentMethodOption.create({
        data: {
          ...paymentMethod,
          userId: defaultUser.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
