import { PrismaClient, UserRole } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const TEST_USER_EMAIL = "teste@operador.local";
const TEST_USER_PASSWORD = "Teste@123456";
const ADMIN_EMAIL = "kevin@operador.local";
const ADMIN_PASSWORD = "Kevin123!";

function calculateCpfVerifier(baseDigits: number[]) {
  return ((baseDigits.reduce((sum, digit, index) => sum + digit * (baseDigits.length + 1 - index), 0) * 10) % 11) % 10;
}

function makeCpf(base: string) {
  const digits = base.split("").map(Number);
  const first = calculateCpfVerifier(digits);
  const second = calculateCpfVerifier([...digits, first]);

  return `${base}${first}${second}`;
}

async function resolveAvailableCpf(currentUserId?: string | null) {
  const candidates = ["123456789", "390533447", "529982247", "987654321"].map(makeCpf);

  for (const cpf of candidates) {
    const owner = await prisma.user.findUnique({
      where: { cpf },
      select: { id: true },
    });

    if (!owner || owner.id === currentUserId) {
      return cpf;
    }
  }

  throw new Error("Não foi possível encontrar um CPF de teste disponível.");
}

async function ensureAdmin() {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: "Kevin",
        role: UserRole.ADMIN,
        isActive: true,
        passwordHash,
        mustChangePassword: false,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
        resetPasswordAttempts: 0,
        resetPasswordBlockedUntil: null,
      },
      select: { id: true, email: true, role: true, isActive: true },
    });
  }

  return prisma.user.create({
    data: {
      name: "Kevin",
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    select: { id: true, email: true, role: true, isActive: true },
  });
}

async function ensureTestUser() {
  const passwordHash = await hashPassword(TEST_USER_PASSWORD);
  const existing = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
    select: { id: true },
  });
  const cpf = await resolveAvailableCpf(existing?.id);

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: "Usuário Teste",
        cpf,
        passwordHash,
        role: UserRole.USER,
        isActive: true,
        mustChangePassword: false,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
        resetPasswordAttempts: 0,
        resetPasswordBlockedUntil: null,
      },
      select: { id: true, name: true, email: true, cpf: true, role: true, isActive: true },
    });
  }

  return prisma.user.create({
    data: {
      name: "Usuário Teste",
      email: TEST_USER_EMAIL,
      cpf,
      passwordHash,
      role: UserRole.USER,
      isActive: true,
    },
    select: { id: true, name: true, email: true, cpf: true, role: true, isActive: true },
  });
}

async function main() {
  const admin = await ensureAdmin();
  const testUser = await ensureTestUser();

  console.log(
    JSON.stringify(
      {
        admin,
        testUser,
        credentials: {
          adminEmail: ADMIN_EMAIL,
          testUserEmail: TEST_USER_EMAIL,
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
