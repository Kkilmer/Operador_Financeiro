export type SettingsFormState = {
  success: boolean;
  message?: string;
  errorCode?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialSettingsFormState: SettingsFormState = {
  success: false,
};
