import { describe, expect, it } from "vitest";

import { formatInstallmentLabel } from "@/features/parcelas/utils/installment-label";

describe("installment label", () => {
  it("usa os campos persistidos para exibir a parcela 4/5", () => {
    expect(formatInstallmentLabel(4, 5)).toBe("4/5");
  });

  it("não depende da descrição do lançamento", () => {
    const freeDescription = "Compra ajustada manualmente sem marcador de parcela";

    expect(freeDescription).not.toContain("(4/5)");
    expect(formatInstallmentLabel(4, 5)).toBe("4/5");
  });
});
