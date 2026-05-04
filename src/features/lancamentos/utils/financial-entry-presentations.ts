import { EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";

export function getEntryTypePresentation(type: EntryType) {
  switch (type) {
    case EntryType.INCOME:
      return {
        label: "Entrada",
        tone: "emerald" as const,
        amountClassName: "text-emerald-700",
      };
    case EntryType.SAVED:
      return {
        label: "Guardado",
        tone: "sky" as const,
        amountClassName: "text-sky-700",
      };
    default:
      return {
        label: "Saída",
        tone: "slate" as const,
        amountClassName: "text-slate-900",
      };
  }
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod) {
  switch (paymentMethod) {
    case PaymentMethod.PIX:
      return "Pix";
    case PaymentMethod.DEBIT:
      return "Débito";
    case PaymentMethod.CREDIT_SINGLE:
      return "Crédito à vista";
    case PaymentMethod.CREDIT_INSTALLMENT:
      return "Crédito parcelado";
    case PaymentMethod.CASH:
      return "Dinheiro";
    case PaymentMethod.BANK_TRANSFER:
      return "Transferência";
    case PaymentMethod.BOLETO:
      return "Boleto";
    default:
      return "Outro";
  }
}

export function getSettlementStatusLabel(type: EntryType, settlementStatus: SettlementStatus) {
  if (type === EntryType.INCOME) {
    return "Recebido";
  }

  if (type === EntryType.SAVED) {
    return "Guardado";
  }

  return settlementStatus === SettlementStatus.SETTLED ? "Pago" : "Pendente";
}
