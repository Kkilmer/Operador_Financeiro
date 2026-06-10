"use client";

import { EntryType, SettlementStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { markFinancialEntryAsPaidAction } from "@/features/lancamentos/actions/mark-financial-entry-as-paid";

type EntryStatusCellProps = {
  entryId: string;
  type: EntryType;
  settlementStatus: SettlementStatus;
};

function getStatusPresentation(type: EntryType, settlementStatus: SettlementStatus) {
  if (type === EntryType.INCOME) {
    return {
      label: "Recebido",
      tone: "emerald" as const,
    };
  }

  if (type === EntryType.SAVED) {
    return {
      label: "Guardado",
      tone: "sky" as const,
    };
  }

  if (settlementStatus === SettlementStatus.SETTLED) {
    return {
      label: "Pago",
      tone: "emerald" as const,
    };
  }

  return {
    label: "Pendente",
    tone: "amber" as const,
  };
}

export function EntryStatusCell({
  entryId,
  type,
  settlementStatus,
}: EntryStatusCellProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const status = getStatusPresentation(type, settlementStatus);
  const canMarkAsPaid =
    type === EntryType.EXPENSE && settlementStatus === SettlementStatus.PENDING;

  return (
    <div className="min-w-0 space-y-2">
      <Badge tone={status.tone}>{status.label}</Badge>

      {canMarkAsPaid ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await markFinancialEntryAsPaidAction(entryId);
              setFeedback(result.message);

              if (result.success) {
                router.refresh();
              }
            })
          }
          className="inline-flex min-h-11 items-center rounded-full border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Marcar como pago"}
        </button>
      ) : null}

      {feedback ? (
        <p className="max-w-[220px] text-xs text-slate-500">{feedback}</p>
      ) : null}
    </div>
  );
}
