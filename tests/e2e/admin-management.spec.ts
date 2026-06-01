import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "kevin@operador.local";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Kevin123!";
const userEmail = process.env.E2E_USER_EMAIL ?? "teste@operador.local";
const userPassword = process.env.E2E_USER_PASSWORD ?? "Teste@123456";
const runAdminTests = process.env.E2E_RUN_ADMIN_TESTS === "true";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("admin management", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    test.skip(!runAdminTests, "Defina E2E_RUN_ADMIN_TESTS=true após rodar npm run test:users.");
  });

  test("ADMIN acessa a área admin", async ({ page }) => {
    await login(page, adminEmail, adminPassword);

    await page.goto("/admin/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
    await expect(page.getByText(userEmail)).toBeVisible();
  });

  test("USER não acessa a área admin", async ({ page }) => {
    await login(page, userEmail, userPassword);

    await page.goto("/admin/usuarios");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("admin edita nome, email e CPF do usuário de teste e restaura os dados", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/admin/usuarios");

    const originalRow = page.getByRole("row", { name: new RegExp(userEmail) });
    await originalRow.getByRole("link", { name: "Editar" }).click();

    await page.getByLabel("Nome").fill("Usuário Teste QA");
    await page.getByLabel("E-mail").fill("teste+qa@operador.local");
    await page.getByLabel("CPF").fill("390.533.447-05");
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page).toHaveURL(/\/admin\/usuarios/);
    await expect(page.getByText("teste+qa@operador.local")).toBeVisible();

    const changedRow = page.getByRole("row", { name: /teste\+qa@operador\.local/ });
    await changedRow.getByRole("link", { name: "Editar" }).click();

    await page.getByLabel("Nome").fill("Usuário Teste");
    await page.getByLabel("E-mail").fill(userEmail);
    await page.getByLabel("CPF").fill("123.456.789-09");
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page).toHaveURL(/\/admin\/usuarios/);
    await expect(page.getByText(userEmail)).toBeVisible();
  });

  test("admin desativa e reativa usuário de teste", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/admin/usuarios");

    const userRow = page.getByRole("row", { name: new RegExp(userEmail) });
    await userRow.getByRole("button", { name: "Desativar" }).click();
    await expect(userRow.getByText("Usuário desativado com sucesso.")).toBeVisible();

    await userRow.getByRole("button", { name: "Reativar" }).click();
    await expect(userRow.getByText("Usuário reativado com sucesso.")).toBeVisible();
  });

  test("admin gera link de reset e restaura a senha temporária do usuário", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/admin/usuarios");

    const userRow = page.getByRole("row", { name: new RegExp(userEmail) });
    await userRow.getByRole("button", { name: "Resetar senha" }).click();

    await expect(userRow.getByText(/Link de redefinição gerado/)).toBeVisible();

    const resetLinkField = userRow.getByRole("textbox");
    await expect(resetLinkField).toHaveValue(/\/redefinir-senha\?token=/);

    const resetUrl = new URL(await resetLinkField.inputValue());
    await page.context().clearCookies();
    await page.goto(`${resetUrl.pathname}${resetUrl.search}`);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('input[name="confirmPassword"]').fill(userPassword);
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page).toHaveURL(/\/dashboard\?status=password-updated/);
  });
});
