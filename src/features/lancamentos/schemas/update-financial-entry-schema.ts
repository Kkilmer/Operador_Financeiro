import { CategoryType, EntryFrequencyProfile, EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";
import { z } from "zod";

const positiveMoneyMessage = "Informe um valor maior que zero.";
const emptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const moneyInputToNumber = z.preprocess((value) => {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");
  }

  return value;
}, z.coerce.number().positive(positiveMoneyMessage));

const optionalMoneyInputToNumber = z.preprocess((value) => {
  if (value === "" || value == null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");
  }

  return value;
}, z.coerce.number().positive(positiveMoneyMessage).optional());

const optionalPositiveIntInput = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().int().positive("Informe um número de parcela válido.").optional(),
);

export const updateFinancialEntrySchema = z
  .object({
    id: z.string().trim().min(1),
    description: z.string().trim().min(1, "Preencha este campo para continuar."),
    amount: moneyInputToNumber,
    eventDate: z.string().min(1, "Informe a data do lançamento."),
    type: z.nativeEnum(EntryType),
    personId: z.string().trim().min(1, "Escolha quem fez este lançamento."),
    accountId: z.string().trim().min(1, "Escolha a conta ou o cartão usado."),
    categoryId: z.string().trim().optional().or(z.literal("")),
    paymentMethod: emptyStringToUndefined(z.nativeEnum(PaymentMethod)),
    notes: z.string().trim().max(500, "Esse detalhe pode ter no máximo 500 caracteres.").optional().or(z.literal("")),
    settlementStatus: emptyStringToUndefined(z.nativeEnum(SettlementStatus)),
    frequencyProfile: emptyStringToUndefined(z.nativeEnum(EntryFrequencyProfile)),
    isInstallment: z.coerce.boolean().default(false),
    installmentCount: z.coerce.number().int().min(0).default(0),
    isInstallmentEntry: z.coerce.boolean().default(false),
    installmentNumber: optionalPositiveIntInput,
    adjustInstallmentPurchase: z.coerce.boolean().default(false),
    installmentPurchaseTotalAmount: optionalMoneyInputToNumber,
    installmentPurchaseInstallmentCount: optionalPositiveIntInput,
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

    if (data.isInstallmentEntry) {
      if (!data.installmentNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["installmentNumber"],
          message: "Informe o número da parcela.",
        });
      }

      if (data.type !== EntryType.EXPENSE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["type"],
          message: "Parcelas continuam como saídas.",
        });
      }

      if (data.adjustInstallmentPurchase) {
        if (!data.installmentPurchaseTotalAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["installmentPurchaseTotalAmount"],
            message: "Informe o valor total da compra.",
          });
        }

        if (!data.installmentPurchaseInstallmentCount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["installmentPurchaseInstallmentCount"],
            message: "Informe a quantidade total de parcelas.",
          });
        } else if (data.installmentNumber && data.installmentPurchaseInstallmentCount < data.installmentNumber) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["installmentPurchaseInstallmentCount"],
            message: "A quantidade total deve comportar o número da parcela atual.",
          });
        }
      }

      return;
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

    if (data.type !== EntryType.EXPENSE && data.isInstallment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isInstallment"],
        message: "Somente saídas podem ser parceladas.",
      });
    }
  });

export type UpdateFinancialEntryInput = z.infer<typeof updateFinancialEntrySchema>;
