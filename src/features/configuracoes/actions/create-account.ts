"use server";

import { AccountType, InstitutionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { accountSettingsSchema } from "@/features/configuracoes/schemas/account-settings-schema";
import { SettingsFormState } from "@/features/configuracoes/types/settings-action.types";

function resolveInstitutionType(type: AccountType) {
  switch (type) {
    case AccountType.CHECKING:
    case AccountType.SAVINGS:
      return InstitutionType.BANK;
    case AccountType.DIGITAL_WALLET:
      return InstitutionType.WALLET_PROVIDER;
    case AccountType.CREDIT_CARD:
    case AccountType.DEBIT_CARD:
    case AccountType.MULTIPLE_CARD:
      return InstitutionType.CARD_ISSUER;
    case AccountType.INVESTMENT:
      return InstitutionType.BROKER;
    default:
      return InstitutionType.OTHER;
  }
}

export async function createAccountAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireCurrentUserId();

  const payload = {
    name: formData.get("name"),
    institutionName: formData.get("institutionName"),
    ownerPersonId: formData.get("ownerPersonId"),
    type: formData.get("type"),
    initialBalance: formData.get("initialBalance"),
    creditLimit: formData.get("creditLimit") || undefined,
    closingDay: formData.get("closingDay") || undefined,
    dueDay: formData.get("dueDay") || undefined,
    isActive: formData.get("isActive") === "on",
  };

  const parsed = accountSettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResult("Revise os campos da conta ou cartão.", "SETTINGS_ACCOUNT_CREATE_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const duplicate = await prisma.financialAccount.findFirst({
    where: {
      userId,
      name: parsed.data.name,
      ownerPersonId: parsed.data.ownerPersonId,
    },
  });

  if (duplicate) {
    return errorResult(
      "Já existe uma conta ou cartão com esse nome para o titular selecionado.",
      "SETTINGS_ACCOUNT_DUPLICATE",
    );
  }

  const ownerPerson = await prisma.person.findFirst({
    where: {
      id: parsed.data.ownerPersonId,
      userId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!ownerPerson) {
    return errorResult("Escolha um titular válido para essa conta ou cartão.", "SETTINGS_ACCOUNT_INVALID_OWNER");
  }

  const institution = parsed.data.institutionName?.trim()
    ? await prisma.financialInstitution.upsert({
        where: {
          name_type: {
            name: parsed.data.institutionName.trim(),
            type: resolveInstitutionType(parsed.data.type),
          },
        },
        update: {
          isActive: true,
        },
        create: {
          name: parsed.data.institutionName.trim(),
          shortName: parsed.data.institutionName.trim(),
          type: resolveInstitutionType(parsed.data.type),
        },
      })
    : null;

  const isCreditCapableCard =
    parsed.data.type === AccountType.CREDIT_CARD || parsed.data.type === AccountType.MULTIPLE_CARD;

  try {
    await prisma.financialAccount.create({
      data: {
        userId,
        name: parsed.data.name,
        type: parsed.data.type,
        institutionId: institution?.id ?? null,
        ownerPersonId: ownerPerson.id,
        initialBalance: parsed.data.initialBalance,
        creditLimit: isCreditCapableCard ? parsed.data.creditLimit ?? null : null,
        closingDay: isCreditCapableCard ? parsed.data.closingDay ?? null : null,
        dueDay: isCreditCapableCard ? parsed.data.dueDay ?? null : null,
        isActive: parsed.data.isActive,
        isShared: false,
      },
    });
  } catch (error) {
    logServerError("settings.create-account", error, { userId, name: parsed.data.name });
    return errorResult(
      "Não conseguimos criar a conta ou cartão agora. Tente novamente ou use o suporte.",
      "SETTINGS_ACCOUNT_CREATE_FAILED",
    );
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");

  return successResult("Conta ou cartão criado com sucesso.");
}
