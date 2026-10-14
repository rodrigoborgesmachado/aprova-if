import { useEffect, useState } from "react";
import { Container, Nav, Navbar, Button } from "react-bootstrap";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useStudent } from "../context/StudentContext";
import { Icon, Failure } from "./UI";
import { config } from "../config/plans";
export const Brand = () => (
  <span className="brand">
    <span className="brand-mark">
      <Icon name="book" />
    </span>
    {config.appName === "AprovaIF" ? (
      <>
        Aprova<span>IF</span>
      </>
    ) : (
      config.appName
    )}
    <span className="brand-dot">.</span>
  </span>
);
export default function Layout() {
  const { email, logout, storageError } = useStudent();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("aprovaif:theme") || "light";
    } catch {
      return "light";
    }
  });
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    try {
      localStorage.setItem("aprovaif:theme", theme);
    } catch {
      /* Theme remains available in memory. */
    }
  }, [theme]);
  useEffect(() => {
    setExpanded(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <Navbar
        expand="lg"
        expanded={expanded}
        onToggle={setExpanded}
        className="topbar"
      >
        <Container>
          <Navbar.Brand as={Link} to="/">
            <Brand />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="mx-auto">
              {email ? (
                <>
                  <Nav.Link as={NavLink} to="/dashboard">
                    Meu estudo
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/provas">
                    Provas
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/desempenho">
                    Desempenho
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/minha-assinatura">
                    Assinatura
                  </Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={NavLink} to="/">
                    Início
                  </Nav.Link>
                  <Nav.Link href="/#como-funciona">Como funciona</Nav.Link>
                  <Nav.Link href="/#provas-anteriores">
                    Provas anteriores
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/planos">
                    Planos
                  </Nav.Link>
                </>
              )}
            </Nav>
            <div className="nav-actions">
              <Button
                variant="link"
                className="theme-button"
                aria-label={
                  theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"
                }
                onClick={() =>
                  setTheme((t) => (t === "light" ? "dark" : "light"))
                }
              >
                <Icon name={theme === "light" ? "moon" : "sun"} />
              </Button>
              {email ? (
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Sair <Icon name="box-arrow-right" />
                </Button>
              ) : (
                <>
                  <Link to="/entrar" className="login-link">
                    Entrar
                  </Link>
                  <Link className="btn btn-primary" to="/entrar">
                    Começar a estudar <Icon name="arrow-up-right" />
                  </Link>
                </>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main id="main">
        {storageError && (
          <Container className="pt-3">
            <Failure message={storageError} />
          </Container>
        )}
        <Outlet />
      </main>
      <footer>
        <Container>
          <div className="footer-top">
            <div>
              <Link to="/">
                <Brand />
              </Link>
              <p>Sua preparação começa aqui.</p>
            </div>
            <div className="footer-links">
              <Link to="/sobre">Sobre o projeto</Link>
              <Link to="/privacidade">Privacidade</Link>
              <Link to="/contato">Contato</Link>
            </div>
            <span className="footer-maker">
              Desenvolvido por <strong>SunSale System</strong>
            </span>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} AprovaIF</span>
            <span>
              Plataforma independente. Não representa oficialmente o IFTM.
            </span>
          </div>
        </Container>
      </footer>
    </>
  );
}
