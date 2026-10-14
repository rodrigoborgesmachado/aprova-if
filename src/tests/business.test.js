import { describe, expect, it, vi } from "vitest";
import { normalizeEmail, validEmail, attachmentUrls } from "../utils/normalize";
import {
  loadProgress,
  updateExam,
  startExam,
} from "../services/storageService";
import { verifySubscription, checkout } from "../services/subscriptionService";
import { performance } from "../utils/performance";
const plans = [1, 6, 12].map((n, i) => ({
  id: String(i),
  durationMonths: n,
  offerCode: `offer${i}`,
}));
const options = (client) => ({
  baseUrl: "https://example.com/api/",
  plans,
  client,
});
const q = {
  id: "q",
  subject: "Matemática",
  alternatives: [
    { id: "a", correct: "" },
    { id: "b", correct: "" },
  ],
};
describe("Identificação e gabarito", () => {
  it("normaliza email e rejeita formatos inválidos", () => {
    expect(normalizeEmail(" Aluno@EMAIL.com ")).toBe("aluno@email.com");
    expect(validEmail(" aluno@email.com ")).toBe(true);
    expect(validEmail("a@b")).toBe(false);
  });
  it("normaliza anexos reais e rejeita esquemas inseguros", () => {
    expect(
      attachmentUrls([
        { link: "https://example.com/image.png", anexo: "" },
        { link: "javascript:alert(1)" },
      ]),
    ).toEqual(["https://example.com/image.png"]);
  });
});
describe("Consulta de assinatura", () => {
  it("checkout usa somente PIN, guarda plano e não inclui email ou oferta na URL", () => {
    const navigate = vi.fn();
    sessionStorage.setItem("aprovaif:email", "aluno@example.com");
    checkout(
      { id: "monthly", pin: "valid pin", offerCode: "private-offer" },
      { navigate, baseUrl: "https://example.com/" },
    );
    expect(navigate).toHaveBeenCalledWith(
      "https://example.com/pin/valid%20pin",
    );
    expect(sessionStorage.getItem("aprovaif:selected-plan")).toBe("monthly");
  });
  it("consulta sequencialmente os três planos e libera somente IsActive true", async () => {
    const client = {
      post: vi
        .fn()
        .mockResolvedValueOnce({
          data: { IsActive: false, SubscriptionStatusCode: "ACTIVE" },
        })
        .mockResolvedValueOnce({
          data: { IsActive: false, DateExpiration: "2099-01-01" },
        })
        .mockResolvedValueOnce({
          data: { IsActive: true, DateExpiration: "2026-11-13" },
        }),
    };
    const result = await verifySubscription(
      " Aluno@EXAMPLE.COM ",
      options(client),
    );
    expect(result.status).toBe("active");
    expect(result.plan.id).toBe("2");
    expect(result.email).toBe("aluno@example.com");
    expect(client.post).toHaveBeenCalledTimes(3);
    expect(client.post.mock.calls[0][0]).toBe(
      "https://example.com/api/subscription/status",
    );
    expect(client.post.mock.calls[0][1]).toEqual({
      Email: "aluno@example.com",
      OfferCode: "offer0",
    });
  });
  it("para após encontrar um plano ativo", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ data: { IsActive: true } }),
    };
    expect((await verifySubscription("a@b.com", options(client))).status).toBe(
      "active",
    );
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it("bloqueia quando todos os planos estão inativos", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ data: { IsActive: false } }),
    };
    expect((await verifySubscription("a@b.com", options(client))).status).toBe(
      "inactive",
    );
    expect(client.post).toHaveBeenCalledTimes(3);
  });
  it("não libera acesso em falhas parciais", async () => {
    const client = {
      post: vi
        .fn()
        .mockRejectedValueOnce(new Error("Network Error"))
        .mockResolvedValue({ data: { IsActive: false } }),
    };
    await expect(
      verifySubscription("a@b.com", options(client)),
    ).rejects.toThrow("Não foi possível verificar");
  });
  it("aceita confirmação ativa mesmo se outro plano falhou", async () => {
    const client = {
      post: vi
        .fn()
        .mockRejectedValueOnce(new Error("Network Error"))
        .mockResolvedValue({ data: { IsActive: true } }),
    };
    expect((await verifySubscription("a@b.com", options(client))).status).toBe(
      "active",
    );
  });
  it("não aceita string true como confirmação", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ data: { IsActive: "true" } }),
    };
    await expect(
      verifySubscription("a@b.com", options(client)),
    ).rejects.toThrow();
  });
  it("informa configuração ausente sem chamar API", async () => {
    const client = { post: vi.fn() };
    await expect(
      verifySubscription("a@b.com", { ...options(client), baseUrl: "" }),
    ).rejects.toThrow("VITE_ECOMMERCE_API_URL");
    expect(client.post).not.toHaveBeenCalled();
  });
  it("respeita limite 429 sem continuar requisições", async () => {
    const client = {
      post: vi.fn().mockRejectedValue({ response: { status: 429 } }),
    };
    await expect(
      verifySubscription("a@b.com", options(client)),
    ).rejects.toThrow("Limite");
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it("explica a limitação 409", async () => {
    const client = {
      post: vi.fn().mockRejectedValue({ response: { status: 409 } }),
    };
    await expect(
      verifySubscription("a@b.com", options(client)),
    ).rejects.toThrow("409");
  });
  it("cancela sem seguir para outras ofertas", async () => {
    const controller = new AbortController();
    controller.abort();
    const client = { post: vi.fn().mockRejectedValue(new Error("canceled")) };
    await expect(
      verifySubscription("a@b.com", {
        ...options(client),
        signal: controller.signal,
      }),
    ).rejects.toThrow("canceled");
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it("impede checkout com PIN placeholder", () => {
    expect(() => checkout({ pin: "PIN_MENSAL" })).toThrow(
      "ainda não está configurado",
    );
    expect(sessionStorage.getItem("aprovaif:selected-plan")).toBeNull();
  });
});
describe("Histórico local e desempenho", () => {
  const exam = { id: "137", name: "Prova real" };
  it("salva, retoma posição e mantém provas e alunos separados", () => {
    updateExam(" a@b.com ", "137", () => startExam(null, exam, [q]));
    updateExam("a@b.com", "137", (e) => ({
      ...e,
      currentQuestionId: "q",
      answers: {
        q: {
          alternativeId: "b",
          answeredAt: "2026-10-13T12:00:00Z",
          correctionStatus: "unknown",
        },
      },
    }));
    updateExam("a@b.com", "167", () =>
      startExam(null, { ...exam, id: "167" }, [q]),
    );
    const stored = loadProgress("A@B.COM");
    expect(stored.exams["137"].answers.q.alternativeId).toBe("b");
    expect(stored.exams["167"]).toBeTruthy();
    expect(loadProgress("other@b.com").exams).toEqual({});
    expect(startExam(stored.exams["137"], exam, [q]).currentQuestionId).toBe(
      "q",
    );
    expect(
      startExam(stored.exams["137"], exam, [q]).answers.q.alternativeId,
    ).toBe("b");
  });
  it("preserva finalização ao reabrir", () => {
    const e = {
      ...startExam(null, exam, [q]),
      status: "completed",
      finishedAt: "2026-10-13",
    };
    expect(startExam(e, exam, [q]).status).toBe("completed");
    expect(startExam(e, exam, [q]).finishedAt).toBe("2026-10-13");
  });
  it("não sobrescreve histórico corrompido", () => {
    localStorage.setItem("aprovaif:v1:a@b.com", "invalid");
    expect(() => updateExam("a@b.com", "137", () => ({}))).toThrow();
    expect(localStorage.getItem("aprovaif:v1:a@b.com")).toBe("invalid");
  });
  it("usa apenas questões corrigíveis na taxa e suporta filtros", () => {
    const questions = [
      { id: "1", subject: "Matemática" },
      { id: "2", subject: "Matemática" },
      { id: "3", subject: "Português" },
      { id: "4", subject: "Português" },
    ];
    const answers = Object.fromEntries(
      ["correct", "incorrect", "unknown"].map((s, i) => [
        String(i + 1),
        { correctionStatus: s, answeredAt: "2026-10-13T12:00:00Z" },
      ]),
    );
    const data = { 137: { exam, questions, answers, status: "completed" } };
    const stats = performance(data);
    expect(stats.accuracy).toBe(50);
    expect(stats.progress).toBe(75);
    expect(stats.pending).toBe(1);
    expect(stats.unknown).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.dates[0].answered).toBe(3);
    expect(performance(data, "137", "Português").accuracy).toBeNull();
    expect(performance(data, "137", "Português").unknown).toBe(1);
    expect(performance(data, "167").answered).toBe(0);
  });
  it("trata início vazio sem números fictícios", () => {
    const stats = performance({});
    expect(stats.answered).toBe(0);
    expect(stats.accuracy).toBeNull();
    expect(stats.progress).toBe(0);
  });
});
