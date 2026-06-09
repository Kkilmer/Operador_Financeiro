import { ReportQueryParams } from "@/features/relatorios/types/report.types";

export const reportQueryKeys = [
  "periodType",
  "year",
  "month",
  "bimester",
  "quarter",
  "semester",
  "startDate",
  "endDate",
  "scope",
  "targetUserId",
] as const;

export function getReportQueryFromSearchParams(searchParams: URLSearchParams): ReportQueryParams {
  const query: ReportQueryParams = {};

  for (const key of reportQueryKeys) {
    const value = searchParams.get(key);

    if (value) {
      query[key] = value;
    }
  }

  return query;
}

export function buildReportQueryString(query: ReportQueryParams) {
  const params = new URLSearchParams();

  for (const key of reportQueryKeys) {
    const value = query[key];

    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}
