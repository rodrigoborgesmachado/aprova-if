import { beforeEach, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAnswerVerification } from "../hooks/useAnswerVerification";
import { getAnswer } from "../services/questoesService";
import { startExam } from "../services/storageService";
vi.mock("../services/questoesService", () => ({ getAnswer: vi.fn() }));
beforeEach(() => {
  vi.mocked(getAnswer).mockReset();
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
function mount() {
  let exam = startExam(null, { name: "Prova" }, [
    { id: "1", subject: "Matemática" },
    { id: "2", subject: "Português" },
  ]);
  const save = vi.fn((id, update) => {
    exam = update(exam);
    return true;
  });
  const hook = renderHook(() => useAnswerVerification("137", save));
  return { ...hook, getExam: () => exam, save };
}
it("salva escolha antes da consulta e registra a correção remota imediatamente", async () => {
  const pending = deferred();
  vi.mocked(getAnswer).mockReturnValue(pending.promise);
  const hook = mount();
  let selection;
  act(() => {
    selection = hook.result.current.selectAnswer("1", "a");
  });
  expect(hook.getExam().answers["1"].correctionStatus).toBe("unknown");
  expect(hook.result.current.checks["1"].loading).toBe(true);
  await act(async () => {
    pending.resolve("correct");
    await selection;
  });
  expect(hook.getExam().answers["1"].correctionStatus).toBe("correct");
  expect(hook.getExam().answers["1"].correctionSource).toBe("GetResposta");
  expect(hook.result.current.checks["1"].loading).toBe(false);
  expect(
    startExam(hook.getExam(), { name: "Prova" }, [
      {
        id: "1",
        subject: "Matemática",
        alternatives: [{ id: "a", correct: "" }],
      },
    ]).answers["1"].correctionStatus,
  ).toBe("correct");
});
it("aborta resposta anterior e ignora resultado atrasado após troca de alternativa", async () => {
  const old = deferred(),
    next = deferred();
  vi.mocked(getAnswer)
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(next.promise);
  const hook = mount();
  let a, b;
  act(() => {
    a = hook.result.current.selectAnswer("1", "a");
  });
  const signal = vi.mocked(getAnswer).mock.calls[0][1];
  act(() => {
    b = hook.result.current.selectAnswer("1", "b");
  });
  expect(signal.aborted).toBe(true);
  await act(async () => {
    next.resolve("incorrect");
    await b;
    old.resolve("correct");
    await a;
  });
  expect(hook.getExam().answers["1"].alternativeId).toBe("b");
  expect(hook.getExam().answers["1"].correctionStatus).toBe("incorrect");
});
it("erro preserva escolha sem contar como erro; nova consulta pode corrigir", async () => {
  vi.mocked(getAnswer)
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce("correct");
  const hook = mount();
  await act(async () => {
    await hook.result.current.selectAnswer("1", "a");
  });
  expect(hook.getExam().answers["1"].correctionStatus).toBe("unknown");
  expect(hook.result.current.checks["1"].error).toContain(
    "Não foi possível verificar",
  );
  await act(async () => {
    await hook.result.current.selectAnswer("1", "a");
  });
  expect(getAnswer).toHaveBeenCalledTimes(2);
  expect(hook.getExam().answers["1"].correctionStatus).toBe("correct");
});
it("consultas de questões distintas não sobrescrevem umas às outras", async () => {
  vi.mocked(getAnswer)
    .mockResolvedValueOnce("correct")
    .mockResolvedValueOnce("incorrect");
  const hook = mount();
  await act(async () => {
    await Promise.all([
      hook.result.current.selectAnswer("1", "a"),
      hook.result.current.selectAnswer("2", "b"),
    ]);
  });
  expect(hook.getExam().answers["1"].correctionStatus).toBe("correct");
  expect(hook.getExam().answers["2"].correctionStatus).toBe("incorrect");
});
it("reiniciar cancela consultas e impede correção da tentativa anterior", async () => {
  const pending = deferred();
  vi.mocked(getAnswer).mockReturnValue(pending.promise);
  const hook = mount();
  let selection;
  act(() => {
    selection = hook.result.current.selectAnswer("1", "a");
  });
  const writes = hook.save.mock.calls.length;
  act(() => hook.result.current.resetChecks());
  await act(async () => {
    pending.resolve("correct");
    await selection;
  });
  expect(hook.save).toHaveBeenCalledTimes(writes);
  expect(hook.result.current.checks).toEqual({});
});
it("desmontar cancela consultas sem gravar resultados tardios", async () => {
  const pending = deferred();
  vi.mocked(getAnswer).mockReturnValue(pending.promise);
  const hook = mount();
  let selection;
  act(() => {
    selection = hook.result.current.selectAnswer("1", "a");
  });
  const signal = vi.mocked(getAnswer).mock.calls[0][1];
  const writes = hook.save.mock.calls.length;
  hook.unmount();
  expect(signal.aborted).toBe(true);
  pending.resolve("correct");
  await selection;
  expect(hook.save).toHaveBeenCalledTimes(writes);
});
