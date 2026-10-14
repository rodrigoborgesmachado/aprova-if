import { test, expect } from "@playwright/test";
// Controlled responses exist only in tests; the application always uses its real services.
const exam = {
  Id: 137,
  nomeProva: "IFTM - CURSOS TÉCNICOS/ENSINO MÉDIO 2024",
  local: "Uberlândia",
  tipoProva: "Tipo I",
  dataAplicacao: "2023",
  quantidadeQuestoesTotal: 2,
};
const questions = [1, 2].map((n) => ({
  Id: 6956 + n,
  numeroQuestao: n,
  materia: n === 1 ? "LÍNGUA PORTUGUESA" : "MATEMÁTICA",
  campoQuestao: `<p>Enunciado da questão ${n}</p>`,
  respostasQuestoes: [
    { codigo: 33500 + n * 2, textoResposta: "Alternativa A", certa: "" },
    { codigo: 33501 + n * 2, textoResposta: "Alternativa B", certa: "" },
  ],
  anexosQuestoes: [],
  prova: exam,
}));
async function prepare(page, active = true) {
  await page.route("**/provas-pagged?**", (route) =>
    route.fulfill({ json: { success: true, total: 1, object: [exam] } }),
  );
  await page.route("**/GetQuestoes?**", (route) =>
    route.fulfill({ json: questions }),
  );
  await page.route("https://subscriptions.test/**", (route) =>
    route.fulfill({
      json: {
        IsActive: active,
        SubscriptionStatusCode: active ? "ACTIVE" : "INACTIVE",
        DateExpiration: "2026-11-13T14:36:27",
      },
    }),
  );
}
test("landing, planos, tema e apresentação mobile", async ({ page }) => {
  await prepare(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Prepare-se para",
  );
  await expect(
    page.getByRole("heading", { name: exam.nomeProva }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  await page
    .getByRole("link", { name: "Conhecer os planos", exact: true })
    .click();
  await expect(page.getByText("Preço a definir")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Escolher mensal", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("PIN de desenvolvimento");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const copyBox = await page.locator(".hero-copy").boundingBox();
  expect(copyBox.x + copyBox.width).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(
    page.getByRole("link", { name: "Entrar", exact: true }),
  ).toBeVisible();
});
test("acesso, respostas, reload, finalização, revisão, reinício e logout", async ({
  page,
}) => {
  await prepare(page);
  let verifications = 0;
  page.on("request", (request) => {
    if (request.url().includes("/subscription/status")) verifications++;
  });
  await page.goto("/provas/137");
  await expect(page).toHaveURL(/entrar/);
  await page.getByLabel("Seu email").fill(" Aluno@EXAMPLE.com ");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("Enunciado da questão 1")).toBeVisible();
  await page.getByRole("radio").nth(1).check();
  await expect(page.getByText("Resposta salva neste navegador.")).toBeVisible();
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect(page.getByText("Enunciado da questão 2")).toBeVisible();
  const before = verifications;
  await page.reload();
  await expect(page.getByText("Enunciado da questão 2")).toBeVisible();
  expect(verifications).toBeGreaterThan(before);
  await page.getByRole("button", { name: "Questão 1, respondida" }).click();
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  await page
    .getByRole("button", { name: "Finalizar prova", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "1 questões ficarão sem resposta",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Finalizar prova" })
    .click();
  await expect(page.getByText(/Correção: Não disponível/)).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.getByRole("link", { name: "Ver desempenho", exact: true }).click();
  await expect(
    page.getByText("Sem gabarito", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".performance-table tbody")).toContainText("50%");
  await page.goto("/provas/137");
  await expect(page.getByText("MODO REVISÃO")).toBeVisible();
  await page
    .getByRole("button", { name: "Reiniciar prova", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reiniciar prova" })
    .click();
  await expect(page.getByRole("radio").nth(1)).not.toBeChecked();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Sair", exact: false }).click();
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("aprovaif:v1:aluno@example.com")),
  );
  expect(history.exams["137"].answers["6957"]).toBeTruthy();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/entrar/);
});
test("assinatura inativa mantém conteúdo bloqueado e retorno manual permite tentar novamente", async ({
  page,
}) => {
  await prepare(page, false);
  await page.goto("/assinatura/retorno");
  await page.getByLabel("Seu email").fill("aluno@example.com");
  await page.getByRole("button", { name: "Já realizei meu pagamento" }).click();
  await expect(page).toHaveURL(/planos/);
  await page.goto("/provas/137");
  await expect(page.getByText("Sua assinatura não está ativa")).toBeVisible();
  await expect(page.getByText("Enunciado da questão 1")).toHaveCount(0);
});
test("falha de integração não libera conteúdo", async ({ page }) => {
  await prepare(page);
  await page.route("https://subscriptions.test/**", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/entrar");
  await page.getByLabel("Seu email").fill("aluno@example.com");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível verificar",
  );
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Vamos confirmar seu acesso" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bom te ver/ })).toHaveCount(
    0,
  );
});
