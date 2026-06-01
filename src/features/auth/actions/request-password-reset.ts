"use server";

import { AuthFormState } from "@/features/auth/types/auth-form-state";

const FORGOT_PASSWORD_ADMIN_MESSAGE =
  "Para redefinir sua senha, solicite um link temporário ao administrador.";

export async function requestPasswordResetAction(
  _prevState: AuthFormState,
  _formData: FormData,
): Promise<AuthFormState> {
  return {
    success: true,
    message: FORGOT_PASSWORD_ADMIN_MESSAGE,
  };
}
