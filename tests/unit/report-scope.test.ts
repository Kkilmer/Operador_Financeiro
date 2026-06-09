import { describe, expect, it } from "vitest";

import { resolveReportScope } from "@/features/relatorios/utils/report-scope";

const admin = {
  id: "admin-1",
  name: "Kevin",
  email: "kevin@operador.local",
  role: "ADMIN" as const,
};

const user = {
  id: "user-1",
  name: "Usuário Teste",
  email: "teste@operador.local",
  role: "USER" as const,
};

const activeUsers = [
  admin,
  {
    id: "user-2",
    name: "Lívia",
    email: "livia@operador.local",
  },
];

describe("resolveReportScope", () => {
  it("força USER a acessar apenas o próprio relatório mesmo com query adulterada", () => {
    const scope = resolveReportScope(
      { scope: "all", targetUserId: "user-2" },
      user,
      activeUsers,
    );

    expect(scope).toMatchObject({
      type: "mine",
      selectedUserId: "user-1",
      userIdFilter: ["user-1"],
    });
  });

  it("permite ADMIN gerar relatório consolidado", () => {
    const scope = resolveReportScope({ scope: "all" }, admin, activeUsers);

    expect(scope).toMatchObject({
      type: "all",
      label: "Todos os usuários",
    });
    expect(scope.userIdFilter).toBeUndefined();
  });

  it("permite ADMIN selecionar usuário ativo específico", () => {
    const scope = resolveReportScope({ scope: "user", targetUserId: "user-2" }, admin, activeUsers);

    expect(scope).toMatchObject({
      type: "user",
      label: "Lívia",
      selectedUserId: "user-2",
      userIdFilter: ["user-2"],
    });
  });

  it("faz fallback seguro para o próprio ADMIN se o usuário específico for inválido", () => {
    const scope = resolveReportScope({ scope: "user", targetUserId: "fake" }, admin, activeUsers);

    expect(scope).toMatchObject({
      type: "mine",
      selectedUserId: "admin-1",
      userIdFilter: ["admin-1"],
    });
    expect(scope.warning).toContain("Por segurança");
  });
});
