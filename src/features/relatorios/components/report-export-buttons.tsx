"use client";

import { useState, useTransition } from "react";

type ExportKind = "pdf" | "csv";

type ExportStatus = {
  tone: "success" | "error";
  message: string;
};

async function getErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    return body?.message ?? fallback;
  }

  return fallback;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ReportExportButtons({
  pdfHref,
  csvHref,
}: {
  pdfHref: string;
  csvHref: string;
}) {
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [pendingKind, setPendingKind] = useState<ExportKind | null>(null);
  const [isPending, startTransition] = useTransition();

  function exportReport(kind: ExportKind) {
    const href = kind === "pdf" ? pdfHref : csvHref;
    const filename = kind === "pdf" ? "relatorio-financeiro.pdf" : "relatorio-financeiro.csv";
    const fallbackMessage =
      kind === "pdf"
        ? "Não conseguimos exportar o PDF agora. Tente novamente ou procure o suporte."
        : "Não conseguimos exportar o CSV agora. Tente novamente ou procure o suporte.";

    setStatus(null);
    setPendingKind(kind);

    startTransition(async () => {
      try {
        const response = await fetch(href, {
          method: "GET",
          credentials: "same-origin",
        });

        if (response.redirected || response.url.includes("/entrar")) {
          setStatus({
            tone: "error",
            message: "Sua sessão expirou. Entre novamente e tente exportar o relatório.",
          });
          return;
        }

        if (!response.ok) {
          setStatus({
            tone: "error",
            message: await getErrorMessage(response, fallbackMessage),
          });
          return;
        }

        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes(kind === "pdf" ? "application/pdf" : "text/csv")) {
          setStatus({
            tone: "error",
            message: fallbackMessage,
          });
          return;
        }

        downloadBlob(await response.blob(), filename);
        setStatus({
          tone: "success",
          message: `${kind === "pdf" ? "PDF" : "CSV"} gerado com sucesso.`,
        });
      } catch {
        setStatus({
          tone: "error",
          message: fallbackMessage,
        });
      } finally {
        setPendingKind(null);
      }
    });
  }

  const disabled = isPending || pendingKind !== null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => exportReport("pdf")}
          disabled={disabled}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingKind === "pdf" ? "Gerando PDF..." : "Exportar PDF"}
        </button>
        <button
          type="button"
          onClick={() => exportReport("csv")}
          disabled={disabled}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingKind === "csv" ? "Gerando CSV..." : "Exportar CSV"}
        </button>
      </div>

      {status ? (
        <div
          className={
            status.tone === "success"
              ? "rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          }
          role="status"
        >
          {status.message}
        </div>
      ) : null}
    </div>
  );
}
