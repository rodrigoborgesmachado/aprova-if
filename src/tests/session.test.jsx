import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { StudentProvider, useStudent } from "../context/StudentContext";
import { verifySubscription } from "../services/subscriptionService";
import { startExam, updateExam } from "../services/storageService";
vi.mock("../services/subscriptionService", () => ({
  verifySubscription: vi.fn(),
}));
function Harness() {
  const { subscription, logout, storageError, saveExam } = useStudent();
  return (
    <>
      <span>{subscription.status}</span>
      <span>{storageError}</span>
      <button onClick={logout}>Sair</button>
      <button
        onClick={() =>
          saveExam("137", () =>
            startExam(null, { name: "Prova" }, [
              { id: "1", subject: "Matemática" },
            ]),
          )
        }
      >
        Salvar
      </button>
    </>
  );
}
afterEach(() => {
  vi.useRealTimers();
  vi.mocked(verifySubscription).mockReset();
});
const active = () => ({
  status: "active",
  verifiedAt: Date.now(),
  plan: { name: "Mensal" },
});
it("consulta a fonte novamente ao restaurar email, sem confiar no status do navegador", async () => {
  sessionStorage.setItem("aprovaif:email", "aluno@example.com");
  sessionStorage.setItem("aprovaif:status", "active");
  vi.mocked(verifySubscription).mockResolvedValue({
    status: "inactive",
    verifiedAt: Date.now(),
  });
  render(
    <StudentProvider>
      <Harness />
    </StudentProvider>,
  );
  await waitFor(() => expect(screen.getByText("inactive")).toBeInTheDocument());
  expect(verifySubscription).toHaveBeenCalledWith(
    "aluno@example.com",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});
it("sair remove a identificação e preserva progresso local", async () => {
  sessionStorage.setItem("aprovaif:email", "aluno@example.com");
  updateExam("aluno@example.com", "137", () =>
    startExam(null, { name: "Prova" }, []),
  );
  vi.mocked(verifySubscription).mockResolvedValue(active());
  render(
    <StudentProvider>
      <Harness />
    </StudentProvider>,
  );
  await waitFor(() => expect(screen.getByText("active")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Sair"));
  expect(sessionStorage.getItem("aprovaif:email")).toBeNull();
  expect(localStorage.getItem("aprovaif:v1:aluno@example.com")).not.toBeNull();
  expect(screen.getByText("anonymous")).toBeInTheDocument();
});
it("revalida ao expirar a janela de cinco minutos", async () => {
  vi.useFakeTimers();
  sessionStorage.setItem("aprovaif:email", "aluno@example.com");
  vi.mocked(verifySubscription).mockImplementation(async () => active());
  await act(async () => {
    render(
      <StudentProvider>
        <Harness />
      </StudentProvider>,
    );
  });
  expect(verifySubscription).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300000);
  });
  expect(verifySubscription).toHaveBeenCalledTimes(2);
});
it("exibe erro de quota sem afirmar que o progresso foi salvo", async () => {
  sessionStorage.setItem("aprovaif:email", "aluno@example.com");
  vi.mocked(verifySubscription).mockResolvedValue(active());
  render(
    <StudentProvider>
      <Harness />
    </StudentProvider>,
  );
  await waitFor(() => expect(screen.getByText("active")).toBeInTheDocument());
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Quota exceeded");
  });
  fireEvent.click(screen.getByText("Salvar"));
  expect(
    screen.getByText(/Não foi possível salvar o progresso/),
  ).toBeInTheDocument();
});
