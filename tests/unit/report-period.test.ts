import { describe, expect, it } from "vitest";

import { getReportPeriod } from "@/features/relatorios/utils/report-period";

describe("getReportPeriod", () => {
  const now = new Date(2026, 5, 9);

  it("calcula relatório mensal com início inclusivo e fim exclusivo", () => {
    const period = getReportPeriod({ periodType: "monthly", year: "2026", month: "6" }, now);

    expect(period.type).toBe("monthly");
    expect(period.startDate).toEqual(new Date(2026, 5, 1));
    expect(period.endDate).toEqual(new Date(2026, 6, 1));
    expect(period.granularity).toBe("day");
  });

  it("calcula bimestre, trimestre, semestre e ano pelos blocos corretos", () => {
    expect(getReportPeriod({ periodType: "bimonthly", year: "2026", bimester: "3" }, now)).toMatchObject({
      startDate: new Date(2026, 4, 1),
      endDate: new Date(2026, 6, 1),
      label: "3º bimestre de 2026",
    });

    expect(getReportPeriod({ periodType: "quarterly", year: "2026", quarter: "2" }, now)).toMatchObject({
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 6, 1),
      label: "2º trimestre de 2026",
    });

    expect(getReportPeriod({ periodType: "semiannual", year: "2026", semester: "2" }, now)).toMatchObject({
      startDate: new Date(2026, 6, 1),
      endDate: new Date(2027, 0, 1),
      label: "2º semestre de 2026",
    });

    expect(getReportPeriod({ periodType: "annual", year: "2026" }, now)).toMatchObject({
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2027, 0, 1),
      label: "Ano de 2026",
    });
  });

  it("valida período personalizado e usa fim exclusivo", () => {
    const period = getReportPeriod(
      { periodType: "custom", startDate: "2026-05-10", endDate: "2026-05-20" },
      now,
    );

    expect(period.startDate).toEqual(new Date(2026, 4, 10));
    expect(period.endDate).toEqual(new Date(2026, 4, 21));
    expect(period.warning).toBeUndefined();
  });

  it("não aceita data inicial maior que data final", () => {
    const period = getReportPeriod(
      { periodType: "custom", startDate: "2026-06-20", endDate: "2026-06-01" },
      now,
    );

    expect(period.warning).toBe("A data inicial não pode ser maior que a data final.");
  });
});
