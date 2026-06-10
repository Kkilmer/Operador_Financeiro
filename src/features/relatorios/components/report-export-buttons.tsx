"use client";

import { useState, useTransition } from "react";

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
  csvHref,
}: {
  csvHref: string;
}) {
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  function exportCsv() {
    const fallbackMessage = "Não conseguimos exportar o CSV agora. Tente novamente ou procure o suporte.";

    setStatus(null);
    setIsExporting(true);

    startTransition(async () => {
      try {
        const response = await fetch(csvHref, {
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

        if (!contentType.includes("text/csv")) {
          setStatus({
            tone: "error",
            message: fallbackMessage,
          });
          return;
        }

        downloadBlob(await response.blob(), "relatorio-financeiro.csv");
        setStatus({
          tone: "success",
          message: "CSV gerado com sucesso.",
        });
      } catch {
        setStatus({
          tone: "error",
          message: fallbackMessage,
        });
      } finally {
        setIsExporting(false);
      }
    });
  }

  const disabled = isPending || isExporting;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportCsv}
          disabled={disabled}
          className="min-h-11 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Gerando CSV..." : "Exportar CSV"}
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
