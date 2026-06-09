import { NextRequest } from "next/server";

import { getFinancialReport } from "@/features/relatorios/services/get-financial-report";
import { FinancialReport } from "@/features/relatorios/types/report.types";
import {
  formatReportCurrency,
  formatReportDate,
  formatReportDateTime,
  getReportEntryTypeLabel,
} from "@/features/relatorios/utils/report-formatters";
import { getReportQueryFromSearchParams } from "@/features/relatorios/utils/report-query";

export const runtime = "nodejs";

function safeCsvValue(value: string | number | null | undefined) {
  const text = String(value ?? "");
  const formulaSafeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${formulaSafeText.replaceAll('"', '""')}"`;
}

function row(values: Array<string | number | null | undefined>) {
  return values.map(safeCsvValue).join(";");
}

function addSection(lines: string[], title: string) {
  if (lines.length > 0) {
    lines.push("");
  }

  lines.push(row([title]));
}

function createCsv(report: FinancialReport) {
  const lines: string[] = [];

  addSection(lines, "Resumo");
  lines.push(row(["Campo", "Valor"]));
  lines.push(row(["Período", report.period.label]));
  lines.push(row(["Escopo", report.scope.label]));
  lines.push(row(["Gerado em", formatReportDateTime(report.generatedAt)]));
  lines.push(row(["Saldo inicial", formatReportCurrency(report.summary.initialBalance)]));
  lines.push(row(["Saldo final", formatReportCurrency(report.summary.finalBalance)]));
  lines.push(row(["Entradas", formatReportCurrency(report.summary.income)]));
  lines.push(row(["Saídas", formatReportCurrency(report.summary.expense)]));
  lines.push(row(["Dinheiro guardado", formatReportCurrency(report.summary.saved)]));
  lines.push(row(["Resultado líquido", formatReportCurrency(report.summary.netResult)]));
  lines.push(row(["Total de parcelas", report.summary.installmentsTotal]));
  lines.push(row(["Parcelas pagas", report.summary.installmentsSettled]));
  lines.push(row(["Parcelas pendentes", report.summary.installmentsPending]));
  lines.push(row(["Quantidade de lançamentos", report.summary.entryCount]));
  lines.push(row(["Maior categoria de gasto", report.summary.topCategoryName ?? "Sem dados"]));
  lines.push(row(["Maior titular/pessoa", report.summary.topPersonName ?? "Sem dados"]));

  addSection(lines, "Lançamentos");
  lines.push(
    row([
      "Usuário",
      "E-mail",
      "Descrição",
      "Tipo",
      "Valor",
      "Competência",
      "Data do evento",
      "Pessoa",
      "Conta/Cartão",
      "Categoria",
      "Forma de pagamento",
    ]),
  );
  for (const entry of report.entries) {
    lines.push(
      row([
        entry.userName,
        entry.userEmail,
        entry.description,
        getReportEntryTypeLabel(entry.type),
        formatReportCurrency(entry.amount),
        formatReportDate(entry.competenceDate),
        formatReportDate(entry.eventDate),
        entry.personName,
        entry.accountName,
        entry.categoryName,
        entry.paymentMethodLabel,
      ]),
    );
  }

  addSection(lines, "Categorias");
  lines.push(row(["Categoria", "Valor total", "Percentual", "Quantidade"]));
  for (const category of report.categoryRanking) {
    lines.push(row([category.label, formatReportCurrency(category.total), `${category.percentage.toFixed(2)}%`, category.count]));
  }

  addSection(lines, "Parcelas");
  lines.push(
    row([
      "Compra",
      "Conta",
      "Categoria",
      "Total de parcelas",
      "Parcelas no período",
      "Valor no período",
      "Valor pago",
      "Valor pendente",
    ]),
  );
  for (const purchase of report.installments.purchases) {
    lines.push(
      row([
        purchase.description,
        purchase.accountName,
        purchase.categoryName,
        purchase.installmentCount,
        purchase.installmentsInPeriod,
        formatReportCurrency(purchase.amountInPeriod),
        formatReportCurrency(purchase.settledAmount),
        formatReportCurrency(purchase.pendingAmount),
      ]),
    );
  }

  addSection(lines, "Titulares/Pessoas");
  lines.push(row(["Pessoa", "Valor total", "Percentual", "Quantidade"]));
  for (const person of report.personRanking) {
    lines.push(row([person.label, formatReportCurrency(person.total), `${person.percentage.toFixed(2)}%`, person.count]));
  }

  addSection(lines, "Formas de pagamento");
  lines.push(row(["Forma", "Valor total", "Percentual", "Quantidade"]));
  for (const paymentMethod of report.paymentMethods) {
    lines.push(
      row([
        paymentMethod.label,
        formatReportCurrency(paymentMethod.total),
        `${paymentMethod.percentage.toFixed(2)}%`,
        paymentMethod.count,
      ]),
    );
  }

  addSection(lines, "Contas/Cartões");
  lines.push(row(["Conta/Cartão", "Valor movimentado", "Quantidade", "Total em parcelas"]));
  for (const account of report.accounts) {
    lines.push(
      row([
        account.label,
        formatReportCurrency(account.total),
        account.count,
        formatReportCurrency(account.installmentTotal),
      ]),
    );
  }

  if (report.userBreakdown.length > 0) {
    addSection(lines, "Usuários");
    lines.push(row(["Usuário", "E-mail", "Entradas", "Saídas", "Guardado", "Resultado", "Quantidade"]));
    for (const user of report.userBreakdown) {
      lines.push(
        row([
          user.userName,
          user.userEmail,
          formatReportCurrency(user.income),
          formatReportCurrency(user.expense),
          formatReportCurrency(user.saved),
          formatReportCurrency(user.netResult),
          user.entryCount,
        ]),
      );
    }
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export async function GET(request: NextRequest) {
  try {
    const query = getReportQueryFromSearchParams(request.nextUrl.searchParams);
    const report = await getFinancialReport(query);
    const csv = createCsv(report);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-financeiro.csv"`,
      },
    });
  } catch (error) {
    console.error("[reports] Falha ao exportar CSV", error);
    return Response.json(
      {
        success: false,
        message: "Não conseguimos exportar o CSV agora. Tente novamente ou procure o suporte.",
      },
      { status: 500 },
    );
  }
}
