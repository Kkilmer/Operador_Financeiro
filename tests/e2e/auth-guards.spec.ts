import { expect, test } from "@playwright/test";

test("usuário não autenticado é redirecionado para /entrar ao abrir /dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("usuário não autenticado é redirecionado para /entrar ao abrir /admin/usuarios", async ({ page }) => {
  await page.goto("/admin/usuarios");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("usuário comum não acessa a área admin", async ({ page }) => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD, "Credenciais E2E de usuário comum não configuradas.");

  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(process.env.E2E_USER_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/admin/usuarios");
  await expect(page).toHaveURL(/\/dashboard/);
});
