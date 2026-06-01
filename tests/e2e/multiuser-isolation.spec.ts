import { expect, test } from "@playwright/test";

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

test("isolamento entre usuários exige credenciais e dados separados", async ({ page }) => {
  test.skip(
    !process.env.E2E_USER_A_EMAIL ||
      !process.env.E2E_USER_A_PASSWORD ||
      !process.env.E2E_USER_B_EMAIL ||
      !process.env.E2E_USER_B_PASSWORD ||
      !process.env.E2E_USER_A_ENTRY_TEXT ||
      !process.env.E2E_USER_B_ENTRY_TEXT,
    "Configure as credenciais e descrições exclusivas dos usuários A e B para validar o isolamento real.",
  );

  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(process.env.E2E_USER_A_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.E2E_USER_A_PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/lancamentos");
  await expect(page.getByText(process.env.E2E_USER_A_ENTRY_TEXT!)).toBeVisible();
  await expect(page.getByText(process.env.E2E_USER_B_ENTRY_TEXT!)).toHaveCount(0);
});
