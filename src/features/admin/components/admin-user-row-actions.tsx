"use client";

import Link from "next/link";
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
const CLIPBOARD_TIMEOUT_IN_MS = 1500;

type AdminUserRowActionsProps = {
  userId: string;
  isActive: boolean;
};

export function AdminUserRowActions({ userId, isActive }: AdminUserRowActionsProps) {
  const router = useRouter();
  const [toggleState, toggleAction] = useActionState(toggleUserActiveAction, initialToggleState);
  const [resetState, resetAction] = useActionState(resetUserPasswordAction, initialResetState);
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  function copyWithTextarea(resetUrl: string) {
    const textarea = document.createElement("textarea");
    textarea.value = resetUrl;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function handleCopyResetUrl(resetUrl: string) {
    let copiedWithClipboard = false;

    try {
      if (navigator.clipboard?.writeText) {
        await Promise.race([
          navigator.clipboard.writeText(resetUrl),
          new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error("clipboard_timeout")), CLIPBOARD_TIMEOUT_IN_MS);
          }),
        ]);
        copiedWithClipboard = true;
      }
    } catch {
      copiedWithClipboard = false;
    }

    if (copiedWithClipboard) {
      setCopied(true);
      setCopyMessage("Link copiado com sucesso.");
      return;
    }

    try {
      if (copyWithTextarea(resetUrl)) {
        setCopied(true);
        setCopyMessage("Link copiado com sucesso.");
        return;
      }
    } catch {
      // Fallback handled below with a friendly message.
    }

    setCopied(false);
    setCopyMessage("Não foi possível copiar. Copie manualmente.");
  }

  useEffect(() => {
    if (toggleState.success) {
      router.refresh();
    }
  }, [router, toggleState.success]);

  useEffect(() => {
    if (!resetState.resetUrl) {
      setCopied(false);
      setCopyMessage(null);
    }
  }, [resetState.resetUrl]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/usuarios/${userId}/editar`}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Editar
        </Link>

        <form action={toggleAction}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="nextActive" value={isActive ? "false" : "true"} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {isActive ? "Desativar" : "Reativar"}
          </button>
        </form>

        <form action={resetAction}>
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
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
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
              />
              <button
                type="button"
                onClick={() => handleCopyResetUrl(resetState.resetUrl ?? "")}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white"
              >
                {copied ? "Link copiado" : "Copiar link"}
              </button>
              {copyMessage ? <p className="text-xs text-slate-600">{copyMessage}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
