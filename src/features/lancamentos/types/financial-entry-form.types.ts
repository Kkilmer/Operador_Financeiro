export type FormMessageMap = Record<string, string[]>;

export type CreateFinancialEntryActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: FormMessageMap;
};
