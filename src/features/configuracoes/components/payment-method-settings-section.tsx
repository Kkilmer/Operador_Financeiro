"use client";

import { PaymentMethod, PaymentMethodBehavior } from "@prisma/client";
import { useMemo, useState } from "react";

import { PaymentMethodForm } from "@/features/configuracoes/components/payment-method-form";
import { PaymentMethodList } from "@/features/configuracoes/components/payment-method-list";

type PaymentMethodListItem = {
  id: string;
  name: string;
  behavior: PaymentMethodBehavior;
  paymentMethod: PaymentMethod;
  requiresInstallments: boolean;
  immediateSettlement: boolean;
  isActive: boolean;
};

type PaymentMethodSettingsSectionProps = {
  paymentMethods: PaymentMethodListItem[];
};

export function PaymentMethodSettingsSection({
  paymentMethods,
}: PaymentMethodSettingsSectionProps) {
  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<string | null>(null);
  const editingPaymentMethod = useMemo(
    () =>
      paymentMethods.find((paymentMethod) => paymentMethod.id === editingPaymentMethodId) ?? null,
    [editingPaymentMethodId, paymentMethods],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Formas de pagamento</h2>
          <p className="mt-1 text-sm text-slate-500">
            Controle as opcoes disponiveis em novos lancamentos sem apagar o historico.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingPaymentMethodId("new")}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          Adicionar forma de pagamento
        </button>
      </div>

      {editingPaymentMethodId ? (
        <div className="mb-5">
          <PaymentMethodForm
            initialValues={
              editingPaymentMethodId === "new"
                ? null
                : editingPaymentMethod
                ? {
                    id: editingPaymentMethod.id,
                    name: editingPaymentMethod.name,
                    behavior: editingPaymentMethod.behavior,
                    paymentMethod: editingPaymentMethod.paymentMethod,
                    requiresInstallments: editingPaymentMethod.requiresInstallments,
                    immediateSettlement: editingPaymentMethod.immediateSettlement,
                    isActive: editingPaymentMethod.isActive,
                  }
                : null
            }
            onCancel={() => setEditingPaymentMethodId(null)}
          />
        </div>
      ) : null}

      <PaymentMethodList
        paymentMethods={paymentMethods}
        onEdit={(paymentMethod) => setEditingPaymentMethodId(paymentMethod.id)}
      />
    </section>
  );
}
