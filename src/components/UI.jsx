import { Component, useEffect } from "react";
import { Alert, Button, Modal, Spinner } from "react-bootstrap";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useStudent } from "../context/StudentContext";
import { config } from "../config/plans";
export const Icon = ({ name, ...props }) => (
  <i aria-hidden="true" className={`bi bi-${name}`} {...props} />
);
export function Loading({ text = "Carregando…" }) {
  return (
    <div className="state-box" role="status">
      <Spinner animation="border" size="sm" /> <span>{text}</span>
    </div>
  );
}
export function Empty({ title, children, icon = "journal-bookmark" }) {
  return (
    <div className="state-box empty">
      <Icon name={icon} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Failure({ message, retry }) {
  return (
    <Alert variant="danger" role="alert">
      {message}
      {retry && (
        <div className="mt-3">
          <Button variant="outline-danger" onClick={retry}>
            Tentar novamente
          </Button>
        </div>
      )}
    </Alert>
  );
}
export function ResourceState({ resource }) {
  return resource.loading ? (
    <Loading />
  ) : resource.error ? (
    <Failure message={resource.error} retry={resource.retry} />
  ) : null;
}
export function ProtectedRoute({ children }) {
  const { subscription, check, email } = useStudent();
  const location = useLocation();
  useEffect(() => {
    if (
      email &&
      subscription.status === "active" &&
      Date.now() - subscription.verifiedAt >= config.verificationTTL
    )
      check();
  }, [location.pathname, subscription.status, subscription.verifiedAt]);
  if (!email)
    return (
      <Navigate to="/entrar" state={{ from: location.pathname }} replace />
    );
  if (
    subscription.status === "checking" ||
    (subscription.status === "active" &&
      Date.now() - subscription.verifiedAt >= config.verificationTTL)
  )
    return <Loading text="Verificando sua assinatura…" />;
  if (subscription.status === "error")
    return (
      <div className="page container narrow">
        <h1>Vamos confirmar seu acesso</h1>
        <Failure message={subscription.message} retry={() => check()} />
        <p>O histórico de estudos continua salvo neste navegador.</p>
      </div>
    );
  if (subscription.status !== "active")
    return (
      <div className="page container narrow">
        <Empty title="Sua assinatura não está ativa" icon="calendar-x">
          Não encontramos um plano ativo para {email}. Seu histórico local foi
          preservado.
        </Empty>
        <Link className="btn btn-primary" to="/planos">
          Escolher um plano
        </Link>
        <Button
          variant="outline-primary"
          className="ms-2"
          onClick={() => check()}
        >
          Verificar novamente
        </Button>
      </div>
    );
  return children;
}
export function Confirm({
  show,
  title,
  children,
  onConfirm,
  onHide,
  label = "Confirmar",
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Voltar
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {label}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
export class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="container page">
        <Failure message="Ocorreu um erro inesperado. Recarregue a página para tentar novamente." />
        <Button onClick={() => window.location.reload()}>Recarregar</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
