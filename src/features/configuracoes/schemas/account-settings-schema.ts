import { AccountType } from "@prisma/client";
import { z } from "zod";

function isCardType(type: AccountType) {
  return (
    type === AccountType.CREDIT_CARD ||
    type === AccountType.DEBIT_CARD ||
    type === AccountType.MULTIPLE_CARD
  );
}

function isCreditCapableCardType(type: AccountType) {
  return type === AccountType.CREDIT_CARD || type === AccountType.MULTIPLE_CARD;
}

export const accountSettingsSchema = z
  .object({
    id: z.string().trim().optional(),
    name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
    institutionName: z.string().trim().optional().or(z.literal("")),
    ownerPersonId: z.string().trim().min(1, "Selecione o titular da conta ou cartão."),
    type: z.nativeEnum(AccountType, {
      errorMap: () => ({ message: "Selecione o tipo da conta ou cartão." }),
    }),
    initialBalance: z.coerce.number().min(0, "O saldo inicial deve ser zero ou positivo.").default(0),
    creditLimit: z.coerce.number().min(0, "O limite deve ser zero ou positivo.").optional(),
    closingDay: z.coerce.number().int().min(1, "Use um dia entre 1 e 31.").max(31, "Use um dia entre 1 e 31.").optional(),
    dueDay: z.coerce.number().int().min(1, "Use um dia entre 1 e 31.").max(31, "Use um dia entre 1 e 31.").optional(),
    isActive: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (isCardType(data.type) && !data.institutionName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["institutionName"],
        message: "Informe a instituição do cartão.",
      });
    }

    if (isCreditCapableCardType(data.type)) {
      if (data.closingDay !== undefined && Number.isNaN(data.closingDay)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["closingDay"],
          message: "Informe um dia de fechamento válido.",
        });
      }

      if (data.dueDay !== undefined && Number.isNaN(data.dueDay)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDay"],
          message: "Informe um dia de vencimento válido.",
        });
      }
    }
  });

export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
