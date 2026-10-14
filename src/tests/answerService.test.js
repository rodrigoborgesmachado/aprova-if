import { beforeEach, expect, it, vi } from "vitest";
const client = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("axios", () => ({ default: { create: () => client } }));
import { getAnswer } from "../services/questoesService";
beforeEach(() => {
  client.get.mockReset();
});
it.each([
  [true, "correct"],
  [false, "incorrect"],
])(
  "normaliza correta=%s consultando pelo código da alternativa",
  async (correta, status) => {
    client.get.mockResolvedValue({ data: { correta } });
    const controller = new AbortController();
    expect(await getAnswer("33500", controller.signal)).toBe(status);
    expect(client.get).toHaveBeenCalledWith("/GetResposta", {
      params: { codigoResposta: "33500" },
      signal: controller.signal,
    });
  },
);
it.each([{}, { correta: "false" }, { correta: null }])(
  "não inventa correção para payload inválido %j",
  async (data) => {
    client.get.mockResolvedValue({ data });
    await expect(getAnswer("33500")).rejects.toThrow("correção inválida");
  },
);
it("propaga falha da API para permitir repetição manual", async () => {
  const failure = new Error("Network Error");
  client.get.mockRejectedValue(failure);
  await expect(getAnswer("33500")).rejects.toBe(failure);
});
