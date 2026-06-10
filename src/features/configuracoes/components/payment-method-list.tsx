"use client";

import { PaymentMethod, PaymentMethodBehavior } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { inactivatePaymentMethodAction } from "@/features/configuracoes/actions/inactivate-payment-method";

type PaymentMethodListItem = {
  id: string;
  name: string;
  behavior: PaymentMethodBehavior;
  paymentMethod: PaymentMethod;
  requiresInstallments: boolean;
  immediateSettlement: boolean;
  isActive: boolean;
};

type PaymentMethodListProps = {
  paymentMethods: PaymentMethodListItem[];
  onEdit: (paymentMethod: PaymentMethodListItem) => void;
};

function paymentBehaviorLabel(behavior: PaymentMethodBehavior) {
  switch (behavior) {
    case PaymentMethodBehavior.PIX:
      return "Pix";
    case PaymentMethodBehavior.DEBITO:
      return "Débito";
    case PaymentMethodBehavior.CREDITO_A_VISTA:
      return "Crédito à vista";
    case PaymentMethodBehavior.CREDITO_PARCELADO:
      return "Crédito parcelado";
    case PaymentMethodBehavior.DINHEIRO:
      return "Dinheiro";
    case PaymentMethodBehavior.TRANSFERENCIA:
      return "Transferência";
    case PaymentMethodBehavior.BOLETO:
      return "Boleto";
    default:
      return "Outro";
  }
}

export function PaymentMethodList({
  paymentMethods,
  onEdit,
}: PaymentMethodListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {paymentMethods.map((paymentMethod) => (
          <article key={paymentMethod.id} className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900">{paymentMethod.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{paymentBehaviorLabel(paymentMethod.behavior)}</p>
              </div>
              <Badge tone={paymentMethod.isActive ? "emerald" : "slate"}>
                {paymentMethod.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Parcelamento</p>
                <p className="mt-1 font-medium text-slate-700">
                  {paymentMethod.requiresInstallments ? "Permite parcelas" : "Sem parcelas"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Liquidação</p>
                <p className="mt-1 font-medium text-slate-700">
                  {paymentMethod.immediateSettlement ? "Imediata" : "Não imediata"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit(paymentMethod)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Editar
              </button>
              {paymentMethod.isActive ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await inactivatePaymentMethodAction(paymentMethod.id);
                      router.refresh();
                    })
                  }
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                >
                  Inativar
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden max-w-full overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-3 pr-4 font-medium">Nome</th>
            <th className="py-3 pr-4 font-medium">Comportamento</th>
            <th className="py-3 pr-4 font-medium">Parcelamento</th>
            <th className="py-3 pr-4 font-medium">Liquidação</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paymentMethods.map((paymentMethod) => (
            <tr key={paymentMethod.id}>
              <td className="py-4 pr-4 font-medium text-slate-900">{paymentMethod.name}</td>
              <td className="py-4 pr-4 text-slate-700">{paymentBehaviorLabel(paymentMethod.behavior)}</td>
              <td className="py-4 pr-4 text-slate-700">
                {paymentMethod.requiresInstallments ? "Sim" : "Não"}
              </td>
              <td className="py-4 pr-4 text-slate-700">
                {paymentMethod.immediateSettlement ? "Imediata" : "Não imediata"}
              </td>
              <td className="py-4 pr-4">
                <Badge tone={paymentMethod.isActive ? "emerald" : "slate"}>
                  {paymentMethod.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </td>
              <td className="py-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(paymentMethod)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Editar
                  </button>
                  {paymentMethod.isActive ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await inactivatePaymentMethodAction(paymentMethod.id);
                          router.refresh();
                        })
                      }
                      className="rounded-full border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                    >
                      Inativar
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
