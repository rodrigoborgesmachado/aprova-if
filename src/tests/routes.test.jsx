import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/UI";
const state = vi.hoisted(() => ({
  email: "",
  subscription: { status: "anonymous" },
  check: vi.fn(),
}));
vi.mock("../context/StudentContext", () => ({ useStudent: () => state }));
const mount = () =>
  render(
    <MemoryRouter initialEntries={["/provas"]}>
      <Routes>
        <Route
          path="provas"
          element={
            <ProtectedRoute>
              <div>Conteúdo protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="entrar" element={<div>Identificação</div>} />
      </Routes>
    </MemoryRouter>,
  );
it("redireciona visitante anônimo", () => {
  state.email = "";
  mount();
  expect(screen.getByText("Identificação")).toBeInTheDocument();
});
it("aguarda verificação sem exibir conteúdo", () => {
  state.email = "a@b.com";
  state.subscription = { status: "checking" };
  mount();
  expect(screen.getByText(/Verificando/)).toBeInTheDocument();
  expect(screen.queryByText("Conteúdo protegido")).toBeNull();
});
it("bloqueia quando API falha e oferece tentar novamente", () => {
  state.email = "a@b.com";
  state.subscription = { status: "error", message: "Falha na API" };
  mount();
  expect(screen.getByText("Falha na API")).toBeInTheDocument();
  expect(screen.queryByText("Conteúdo protegido")).toBeNull();
});
it("bloqueia assinatura inativa", () => {
  state.email = "a@b.com";
  state.subscription = { status: "inactive" };
  mount();
  expect(screen.getByText("Sua assinatura não está ativa")).toBeInTheDocument();
  expect(screen.queryByText("Conteúdo protegido")).toBeNull();
});
it("libera apenas verificação ativa recente", () => {
  state.email = "a@b.com";
  state.subscription = { status: "active", verifiedAt: Date.now() };
  mount();
  expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
});
it("não usa confirmação expirada para liberar conteúdo", () => {
  state.email = "a@b.com";
  state.subscription = { status: "active", verifiedAt: Date.now() - 600000 };
  mount();
  expect(screen.queryByText("Conteúdo protegido")).toBeNull();
  expect(screen.getByText(/Verificando/)).toBeInTheDocument();
});
