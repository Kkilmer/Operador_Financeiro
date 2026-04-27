export type SettingsFormState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialSettingsFormState: SettingsFormState = {
  success: false,
};
