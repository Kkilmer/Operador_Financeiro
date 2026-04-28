import { CategoryType } from "@prisma/client";
import { z } from "zod";

export const categorySettingsSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
  type: z.nativeEnum(CategoryType, {
    errorMap: () => ({ message: "Selecione o tipo da categoria." }),
  }),
  color: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^#([0-9A-Fa-f]{6})$/.test(value), {
      message: "A cor deve estar no formato hexadecimal, por exemplo #22C55E.",
    }),
  icon: z.string().trim().max(40, "O ícone deve ter no máximo 40 caracteres.").optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});

export type CategorySettingsInput = z.infer<typeof categorySettingsSchema>;
