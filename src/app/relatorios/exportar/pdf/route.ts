import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";

import { getFinancialReport } from "@/features/relatorios/services/get-financial-report";
import { FinancialReport } from "@/features/relatorios/types/report.types";
import {
  formatReportCurrency,
  formatReportDateTime,
  getReportEntryTypeLabel,
} from "@/features/relatorios/utils/report-formatters";
import { getReportQueryFromSearchParams } from "@/features/relatorios/utils/report-query";

export const runtime = "nodejs";

function addLine(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
  doc.font("Helvetica").text(value);
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(1.2);
  doc.fontSize(15).font("Helvetica-Bold").text(title);
  doc.moveDown(0.4);
}

function addRankingRows(
  doc: PDFKit.PDFDocument,
  rows: Array<{ label: string; total: number; percentage?: number; count: number }>,
) {
  if (rows.length === 0) {
    doc.font("Helvetica").text("Sem dados para este período.");
    return;
  }

  for (const row of rows.slice(0, 10)) {
    const percentage = typeof row.percentage === "number" ? ` | ${row.percentage.toFixed(1)}%` : "";
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`- ${row.label}: ${formatReportCurrency(row.total)}${percentage} | ${row.count} lançamento(s)`);
  }
}

async function createPdf(report: FinancialReport) {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).font("Helvetica-Bold").text("Relatório Financeiro");
    doc.moveDown(0.4);
    doc.fontSize(10).font("Helvetica").fillColor("#475569");
    doc.text("Operador Financeiro");
    doc.fillColor("#111827");
    doc.moveDown();

    addLine(doc, "Período", report.period.label);
    addLine(doc, "Escopo", report.scope.label);
    addLine(doc, "Gerado em", formatReportDateTime(report.generatedAt));

    addSectionTitle(doc, "Resumo financeiro");
    addLine(doc, "Saldo inicial", formatReportCurrency(report.summary.initialBalance));
    addLine(doc, "Saldo final", formatReportCurrency(report.summary.finalBalance));
    addLine(doc, "Entradas", formatReportCurrency(report.summary.income));
    addLine(doc, "Saídas", formatReportCurrency(report.summary.expense));
    addLine(doc, "Dinheiro guardado", formatReportCurrency(report.summary.saved));
    addLine(doc, "Resultado líquido", formatReportCurrency(report.summary.netResult));
    addLine(doc, "Quantidade de lançamentos", String(report.summary.entryCount));
    addLine(
      doc,
      "Parcelas",
      `${report.summary.installmentsTotal} total | ${report.summary.installmentsSettled} pagas | ${report.summary.installmentsPending} pendentes`,
    );

    addSectionTitle(doc, "Ranking de categorias");
    addRankingRows(doc, report.categoryRanking);

    addSectionTitle(doc, "Ranking por titular");
    addRankingRows(doc, report.personRanking);

    addSectionTitle(doc, "Formas de pagamento");
    addRankingRows(
      doc,
      report.paymentMethods
        .filter((row) => row.count > 0)
        .map((row) => ({
          label: row.label,
          total: row.total,
          percentage: row.percentage,
          count: row.count,
        })),
    );

    addSectionTitle(doc, "Parcelas");
    addLine(doc, "Total parcelado", formatReportCurrency(report.installments.totalAmount));
    addLine(doc, "Valor pago", formatReportCurrency(report.installments.settledAmount));
    addLine(doc, "Valor pendente", formatReportCurrency(report.installments.pendingAmount));

    for (const purchase of report.installments.purchases.slice(0, 8)) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          `- ${purchase.description}: ${formatReportCurrency(purchase.amountInPeriod)} (${purchase.installmentsInPeriod}/${purchase.installmentCount})`,
        );
    }

    addSectionTitle(doc, "Últimos lançamentos do relatório");
    for (const entry of report.entries.slice(0, 12)) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          `- ${entry.description} | ${getReportEntryTypeLabel(entry.type)} | ${entry.personName} | ${formatReportCurrency(entry.amount)}`,
        );
    }

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("#64748b")
      .text("Relatório gerado pelo Operador Financeiro. Dados respeitam o escopo e as permissões do usuário autenticado.", {
        align: "center",
      });

    doc.end();
  });
}

export async function GET(request: NextRequest) {
  try {
    const query = getReportQueryFromSearchParams(request.nextUrl.searchParams);
    const report = await getFinancialReport(query);
    const pdf = await createPdf(report);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-financeiro.pdf"`,
      },
    });
  } catch (error) {
    console.error("[reports] Falha ao exportar PDF", error);
    return Response.json(
      {
        success: false,
        message: "Não conseguimos exportar o PDF agora. Tente novamente ou procure o suporte.",
      },
      { status: 500 },
    );
  }
}
