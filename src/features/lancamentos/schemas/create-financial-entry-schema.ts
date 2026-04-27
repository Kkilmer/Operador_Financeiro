import { PaymentMethod, EntryType, EntryFrequencyProfile, SettlementStatus } from "@prisma/client";
import { z } from "zod";

const positiveMoneyMessage = "Informe um valor maior que zero.";

export const createFinancialEntrySchema = z
  .object({
    description: z.string().trim().min(1, "Informe a descricao do lancamento."),
    amount: z.coerce.number().positive(positiveMoneyMessage),
    eventDate: z.string().min(1, "Informe a data do lancamento."),
    type: z.nativeEnum(EntryType, {
      errorMap: () => ({ message: "Selecione se o lancamento e entrada ou saida." }),
    }),
    personId: z.string().trim().min(1, "Selecione a pessoa responsavel."),
    accountId: z.string().trim().min(1, "Selecione a conta ou cartao."),
    categoryId: z.string().trim().optional().or(z.literal("")),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: "Selecione a forma de pagamento." }),
    }),
    notes: z.string().trim().max(500, "A observacao pode ter no maximo 500 caracteres.").optional().or(z.literal("")),
    settlementStatus: z.nativeEnum(SettlementStatus).default(SettlementStatus.PENDING),
    frequencyProfile: z.nativeEnum(EntryFrequencyProfile, {
      errorMap: () => ({ message: "Informe se o gasto e fixo ou variavel." }),
    }),
    isInstallment: z.coerce.boolean().default(false),
    installmentCount: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.type === EntryType.EXPENSE && !data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "Categoria e obrigatoria para saidas.",
      });
    }

    if (data.type === EntryType.INCOME && data.paymentMethod === PaymentMethod.CREDIT_INSTALLMENT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Entradas nao podem ser registradas como credito parcelado.",
      });
    }

    if (data.isInstallment && data.type !== EntryType.EXPENSE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isInstallment"],
        message: "Apenas saidas podem ser parceladas.",
      });
    }

    if (data.isInstallment && data.paymentMethod !== PaymentMethod.CREDIT_INSTALLMENT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Compras parceladas devem usar a forma de pagamento credito parcelado.",
      });
    }

    if (data.isInstallment && data.installmentCount < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installmentCount"],
        message: "Informe pelo menos 2 parcelas para compras parceladas.",
      });
    }

    if (!data.isInstallment && data.installmentCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installmentCount"],
        message: "Quantidade de parcelas so pode ser informada quando o lancamento for parcelado.",
      });
    }
  });

export type CreateFinancialEntryInput = z.infer<typeof createFinancialEntrySchema>;
