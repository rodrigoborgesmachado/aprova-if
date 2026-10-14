import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StudentProvider } from "./context/StudentContext";
import Layout from "./components/Layout";
import { ErrorBoundary, ProtectedRoute, Empty, Loading } from "./components/UI";
import { Home, Login, Plans, Institutional } from "./pages/PublicPages";
const Dashboard = lazy(() =>
  import("./pages/StudentPages").then((m) => ({ default: m.Dashboard })),
);
const Exams = lazy(() =>
  import("./pages/StudentPages").then((m) => ({ default: m.Exams })),
);
const Performance = lazy(() =>
  import("./pages/StudentPages").then((m) => ({ default: m.Performance })),
);
const Subscription = lazy(() =>
  import("./pages/StudentPages").then((m) => ({ default: m.Subscription })),
);
const ExamPage = lazy(() => import("./pages/ExamPage"));
export default function App() {
  const protect = (component) => (
    <ProtectedRoute>
      <Suspense fallback={<Loading />}>{component}</Suspense>
    </ProtectedRoute>
  );
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StudentProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="entrar" element={<Login />} />
              <Route path="planos" element={<Plans />} />
              <Route path="assinatura/retorno" element={<Login returning />} />
              {["sobre", "privacidade", "contato"].map((type) => (
                <Route
                  key={type}
                  path={type}
                  element={<Institutional type={type} />}
                />
              ))}
              <Route path="dashboard" element={protect(<Dashboard />)} />
              <Route path="provas" element={protect(<Exams />)} />
              <Route path="provas/:id" element={protect(<ExamPage />)} />
              <Route path="desempenho" element={protect(<Performance />)} />
              <Route
                path="minha-assinatura"
                element={protect(<Subscription />)}
              />
              <Route
                path="*"
                element={
                  <div className="container page">
                    <Empty title="Página não encontrada">
                      Use o menu para continuar navegando.
                    </Empty>
                  </div>
                }
              />
            </Route>
          </Routes>
        </StudentProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
