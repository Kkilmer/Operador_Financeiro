export type AuthFormState = {
  success: boolean;
  message?: string;
  errorCode?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  debugResetUrl?: string;
};
