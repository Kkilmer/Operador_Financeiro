export type AuthFormState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  debugResetUrl?: string;
};
