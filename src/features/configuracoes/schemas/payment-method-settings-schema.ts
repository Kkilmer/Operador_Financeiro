import { PaymentMethod, PaymentMethodBehavior } from "@prisma/client";
import { z } from "zod";

export const paymentMethodSettingsSchema = z
  .object({
    id: z.string().trim().optional(),
    name: z.string().trim().min(2, "Informe o nome da forma de pagamento."),
    behavior: z.nativeEnum(PaymentMethodBehavior, {
      errorMap: () => ({ message: "Selecione o comportamento da forma de pagamento." }),
    }),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: "Selecione o tipo interno da forma de pagamento." }),
    }),
    requiresInstallments: z.coerce.boolean().default(false),
    immediateSettlement: z.coerce.boolean().default(false),
    isActive: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (
      data.behavior === PaymentMethodBehavior.CREDITO_PARCELADO &&
      !data.requiresInstallments
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiresInstallments"],
        message: "Credito parcelado deve exigir parcelamento.",
      });
    }
  });

export type PaymentMethodSettingsInput = z.infer<typeof paymentMethodSettingsSchema>;
