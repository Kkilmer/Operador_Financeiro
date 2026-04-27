"use client";

import { CategoryType, PaymentMethod } from "@prisma/client";
import { ReactNode, useEffect, useState } from "react";

import { FinancialEntryForm } from "@/features/lancamentos/components/financial-entry-form";

type SelectOption = {
  id: string;
  label: string;
};

type CategoryOption = SelectOption & {
  type: CategoryType;
};

type PaymentMethodOption = SelectOption & {
  paymentMethod: PaymentMethod;
};

function QuickEntrySheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-slate-950/35"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-center px-4 pt-3">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>
        <div className="max-h-[88vh] overflow-y-auto px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Novo lancamento</p>
              <h2 className="text-lg font-semibold text-slate-900">Registro rapido</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600"
            >
              Fechar
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

type FloatingActionButtonProps = {
  people: SelectOption[];
  accounts: SelectOption[];
  categories: CategoryOption[];
  paymentMethods: PaymentMethodOption[];
};

export function FloatingActionButton({
  people,
  accounts,
  categories,
  paymentMethods,
}: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Novo lancamento"
        className="fixed bottom-[86px] left-1/2 z-40 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-3xl font-semibold text-white shadow-2xl transition active:scale-95"
      >
        +
      </button>

      <QuickEntrySheet open={open} onClose={() => setOpen(false)}>
        <FinancialEntryForm
          mode="sheet"
          onSuccess={() => setOpen(false)}
          people={people}
          accounts={accounts}
          categories={categories}
          paymentMethods={paymentMethods}
        />
      </QuickEntrySheet>
    </>
  );
}
