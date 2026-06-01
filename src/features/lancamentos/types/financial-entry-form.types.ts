export type FormMessageMap = Record<string, string[]>;

export type CreateFinancialEntryActionState = {
  success: boolean;
  message?: string;
  errorCode?: string;
  fieldErrors?: FormMessageMap;
  installmentAdjustment?: {
    currentTotalAmount: number;
    currentTotalInstallments: number;
    requestedInstallmentNumber: number;
    suggestedTotalInstallments: number;
    nextInstallmentNumber: number | null;
  };
};
