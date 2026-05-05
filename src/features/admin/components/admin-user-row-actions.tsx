"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AdminUserActionState,
  toggleUserActiveAction,
} from "@/features/admin/actions/toggle-user-active";
import {
  ResetUserPasswordState,
  resetUserPasswordAction,
} from "@/features/admin/actions/reset-user-password";

const initialToggleState: AdminUserActionState = { success: false };
const initialResetState: ResetUserPasswordState = { success: false };

type AdminUserRowActionsProps = {
  userId: string;
  isActive: boolean;
};

export function AdminUserRowActions({ userId, isActive }: AdminUserRowActionsProps) {
  const router = useRouter();
  const [toggleState, toggleAction] = useActionState(toggleUserActiveAction, initialToggleState);
  const [resetState, resetAction] = useActionState(resetUserPasswordAction, initialResetState);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (toggleState.success) {
      router.refresh();
    }
  }, [router, toggleState.success]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={toggleAction}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="nextActive" value={isActive ? "false" : "true"} />
          <button
            type="submit"
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {isActive ? "Desativar" : "Reativar"}
          </button>
        </form>

        <form action={resetAction}>
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
          >
            Resetar senha
          </button>
        </form>
      </div>

      {toggleState.message ? (
        <p className={`text-xs ${toggleState.success ? "text-emerald-700" : "text-rose-700"}`}>
          {toggleState.message}
        </p>
      ) : null}

      {resetState.message ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className={`text-xs ${resetState.success ? "text-emerald-700" : "text-rose-700"}`}>
            {resetState.message}
          </p>

          {resetState.resetUrl ? (
            <div className="space-y-2">
              <input
                readOnly
                value={resetState.resetUrl}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(resetState.resetUrl ?? "");
                  setCopied(true);
                }}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white"
              >
                {copied ? "Link copiado" : "Copiar link"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
