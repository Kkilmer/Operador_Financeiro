import { DashboardBreakdownItem } from "@/features/dashboard/types/dashboard.types";

export function sumTotals(items: Array<{ total: number }>) {
  return items.reduce((sum, item) => sum + item.total, 0);
}

export function sortBreakdown(items: DashboardBreakdownItem[]) {
  return [...items].sort((a, b) => b.total - a.total);
}

export function toMapTotals<T extends string | null | undefined>(
  rows: Array<{ key: T; total: number }>,
  fallbackLabel: string,
) {
  const map = new Map<string, number>();

  for (const row of rows) {
    const label = row.key?.trim() || fallbackLabel;
    map.set(label, (map.get(label) ?? 0) + row.total);
  }

  return sortBreakdown(
    Array.from(map.entries()).map(([label, total]) => ({
      label,
      total,
    })),
  );
}
