import { PaymentMethod, EntryType, EntryFrequencyProfile, SettlementStatus } from "@prisma/client";
import { z } from "zod";

const positiveMoneyMessage = "Informe um valor maior que zero.";
const emptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const moneyInputToNumber = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");

    return normalized;
  }

  return value;
}, z.coerce.number().positive(positiveMoneyMessage));

export const createFinancialEntrySchema = z
  .object({
    description: z.string().trim().min(1, "Preencha este campo para continuar."),
    amount: moneyInputToNumber,
    eventDate: z.string().min(1, "Informe a data do lançamento."),
    type: z.nativeEnum(EntryType, {
      errorMap: () => ({ message: "Escolha se este lançamento é uma entrada ou uma saída." }),
    }),
    personId: z.string().trim().min(1, "Escolha quem fez este lançamento."),
    accountId: z.string().trim().min(1, "Escolha a conta ou o cartão usado."),
    categoryId: z.string().trim().optional().or(z.literal("")),
    paymentMethod: emptyStringToUndefined(
      z.nativeEnum(PaymentMethod, {
        errorMap: () => ({ message: "Escolha como esse pagamento foi feito." }),
      }),
    ),
    notes: z.string().trim().max(500, "Esse detalhe pode ter no máximo 500 caracteres.").optional().or(z.literal("")),
    settlementStatus: emptyStringToUndefined(z.nativeEnum(SettlementStatus)),
    frequencyProfile: emptyStringToUndefined(
      z.nativeEnum(EntryFrequencyProfile, {
        errorMap: () => ({ message: "Informe se o gasto é fixo ou pontual." }),
      }),
    ),
    isInstallment: z.coerce.boolean().default(false),
    installmentCount: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message:
          data.type === EntryType.INCOME
            ? "Escolha uma categoria para a entrada."
            : data.type === EntryType.SAVED
              ? "Escolha onde esse dinheiro foi guardado."
              : "Escolha uma categoria para a saída.",
      });
    }

    if (data.type === EntryType.EXPENSE && !data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Escolha como esse pagamento foi feito.",
      });
    }

    if (data.type === EntryType.EXPENSE && !data.settlementStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["settlementStatus"],
        message: "Informe se esse gasto já foi pago.",
      });
    }

    if (data.type === EntryType.EXPENSE && !data.frequencyProfile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["frequencyProfile"],
        message: "Informe se esse gasto é fixo ou pontual.",
      });
    }

    if (data.type === EntryType.INCOME && data.paymentMethod === PaymentMethod.CREDIT_INSTALLMENT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Entradas não podem ser registradas como parceladas.",
      });
    }

    if (data.type === EntryType.SAVED && data.paymentMethod === PaymentMethod.CREDIT_INSTALLMENT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Dinheiro guardado não pode ser registrado como parcelado.",
      });
    }

    if (data.isInstallment && data.type !== EntryType.EXPENSE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isInstallment"],
        message:
          data.type === EntryType.SAVED
            ? "Dinheiro guardado não pode ser parcelado."
            : "Só saídas podem ser parceladas.",
      });
    }

    if (data.isInstallment && data.paymentMethod !== PaymentMethod.CREDIT_INSTALLMENT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Para parcelar, escolha a opção de pagamento parcelado.",
      });
    }

    if (data.isInstallment && data.installmentCount < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installmentCount"],
        message: "Informe pelo menos 2 parcelas.",
      });
    }

    if (!data.isInstallment && data.installmentCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installmentCount"],
        message: "Só informe parcelas quando o lançamento for parcelado.",
      });
    }
  });

export type CreateFinancialEntryInput = z.infer<typeof createFinancialEntrySchema>;
