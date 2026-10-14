import { useState } from "react";
import { Accordion, Alert, Button, Container, Form } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../components/Layout";
import { Icon, ResourceState } from "../components/UI";
import { useStudent } from "../context/StudentContext";
import { subscriptionPlans } from "../config/plans";
import { checkout } from "../services/subscriptionService";
import { listExams } from "../services/questoesService";
import { useResource } from "../hooks/useResource";
import { normalizeEmail, validEmail } from "../utils/normalize";
export function PlanCards() {
  const [error, setError] = useState("");
  return (
    <>
      {error && (
        <Alert variant="warning" role="alert">
          {error}
        </Alert>
      )}
      <div className="plan-grid">
        {subscriptionPlans.map((plan) => (
          <article
            className={`plan-card ${plan.id === "semiannual" ? "popular" : ""}`}
            key={plan.id}
          >
            {plan.id === "semiannual" && (
              <span className="popular-label">MAIS POPULAR</span>
            )}
            <span className="eyebrow">
              {plan.durationMonths}{" "}
              {plan.durationMonths === 1 ? "MÊS" : "MESES"} DE PREPARAÇÃO
            </span>
            <h3>{plan.name}</h3>
            <div className="plan-price">
              {plan.price === null
                ? "Preço a definir"
                : plan.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
            </div>
            <p>
              {plan.price === null
                ? "Valor ainda não configurado"
                : "Pelo período completo"}
            </p>
            <ul>
              {[
                "Todas as provas disponíveis",
                "Questões no seu ritmo",
                "Histórico e desempenho",
                "Acesso pelo celular e computador",
              ].map((b) => (
                <li key={b}>
                  <Icon name="check2" />
                  {b}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.id === "semiannual" ? "primary" : "outline-primary"}
              className="w-100"
              onClick={() => {
                try {
                  checkout(plan);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Escolher {plan.name.toLowerCase()} <Icon name="arrow-right" />
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
export function Home() {
  const resource = useResource(listExams);
  return (
    <>
      <section className="hero-section">
        <Container className="hero-grid">
          <div className="hero-copy">
            <span className="pill">
              <span className="live-dot" /> SEU PRÓXIMO PASSO COMEÇA AQUI
            </span>
            <h1>
              Prepare-se para
              <br /> conquistar{" "}
              <span>
                sua vaga
                <br /> no IFTM.
              </span>
            </h1>
            <p>
              Resolva questões de processos seletivos anteriores, acompanhe sua
              evolução e estude no seu ritmo.
            </p>
            <div className="hero-actions">
              <Link to="/entrar" className="btn btn-primary btn-lg">
                Começar a estudar <Icon name="arrow-right" />
              </Link>
              <Link to="/planos" className="btn btn-outline-primary btn-lg">
                Conhecer os planos
              </Link>
            </div>
            <div className="hero-note">
              <Icon name="check-circle-fill" /> Provas reais <span /> Estudo no
              seu ritmo <span /> Evolução de verdade
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Ilustração de materiais de estudo"
          >
            <div className="art-grid" />
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <span className="art-star star-one">✦</span>
            <span className="art-star star-two">✧</span>
            <div className="paper">
              <div className="paper-header">
                <Brand />
                <span>MEU PLANO DE ESTUDOS</span>
              </div>
              <div className="paper-title">
                Cada questão,
                <br />
                um passo mais perto.
              </div>
              <div className="paper-line" />
              <div className="paper-line short" />
              <div className="paper-option">
                <span>
                  <Icon name="check" />
                </span>
                <div />
              </div>
              <div className="paper-option faint">
                <span>B</span>
                <div />
              </div>
              <div className="paper-option faint">
                <span>C</span>
                <div />
              </div>
              <div className="paper-progress">
                <span>Um dia de cada vez.</span>
                <div>
                  <i />
                </div>
              </div>
            </div>
            <div className="floating-note note-top">
              <span className="mini-icon">
                <Icon name="mortarboard" />
              </span>
              <div>
                <strong>De olho na sua vaga</strong>
                <small>O próximo capítulo é seu.</small>
              </div>
            </div>
            <div className="floating-note note-bottom">
              <span className="mini-icon">
                <Icon name="check2-circle" />
              </span>
              <div>
                <strong>Aprender. Praticar. Evoluir.</strong>
                <small>Transforme esforço em progresso.</small>
              </div>
              <Icon name="stars" />
            </div>
            <div className="pencil" />
            <div className="art-label">O FUTURO SE CONSTRÓI AGORA ↗</div>
          </div>
        </Container>
      </section>
      <section className="trust-strip">
        <Container>
          <span>Uma preparação que faz sentido.</span>
          <div>
            <Icon name="journal-check" /> Questões de provas anteriores
          </div>
          <div>
            <Icon name="bar-chart" /> Progresso acompanhado
          </div>
          <div>
            <Icon name="phone" /> Onde você estiver
          </div>
        </Container>
      </section>
      <section id="como-funciona" className="section">
        <Container>
          <div className="section-heading">
            <span className="eyebrow">
              SIMPLES PARA COMEÇAR. FEITO PARA CONTINUAR.
            </span>
            <h2>Sua próxima conquista, passo a passo.</h2>
            <p>Menos complicação. Mais tempo para o que importa: aprender.</p>
          </div>
          <div className="steps-grid">
            {[
              [
                "01",
                "person-check",
                "Escolha seu plano",
                "Encontre o período ideal para sua preparação e faça a contratação no Ecommerce.",
              ],
              [
                "02",
                "journal-text",
                "Pratique com provas reais",
                "Acesse com seu email e resolva questões de processos seletivos anteriores do IFTM.",
              ],
              [
                "03",
                "graph-up-arrow",
                "Acompanhe sua evolução",
                "Retome de onde parou e descubra como seus estudos avançam a cada questão.",
              ],
            ].map(([n, icon, title, text]) => (
              <article className="step-card" key={n}>
                <div className="step-top">
                  <span className="feature-icon">
                    <Icon name={icon} />
                  </span>
                  <span className="step-number">{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <section id="provas-anteriores" className="section exams-section">
        <Container>
          <div className="section-heading horizontal">
            <div>
              <span className="eyebrow">
                PRATIQUE COM O QUE REALMENTE IMPORTA
              </span>
              <h2>O caminho passa por boas questões.</h2>
              <p>Conheça as provas anteriores disponíveis no catálogo.</p>
            </div>
            <Link to="/provas" className="text-link">
              Explorar as provas <Icon name="arrow-right" />
            </Link>
          </div>
          <ResourceState resource={resource} />
          {resource.data?.length === 0 && (
            <p>Nenhuma prova disponível no momento.</p>
          )}
          <div className="exam-grid">
            {resource.data?.slice(0, 3).map((e) => (
              <article className="exam-card" key={e.id}>
                <div className="exam-card-top">
                  <span className="feature-icon">
                    <Icon name="file-earmark-text" />
                  </span>
                  <span className="badge-soft">IFTM · {e.year}</span>
                </div>
                <h3>{e.name}</h3>
                <p>
                  <Icon name="geo-alt" /> {e.location} · {e.type}
                </p>
                <div className="exam-card-bottom">
                  <span>
                    <Icon name="list-check" /> {e.total} questões
                  </span>
                  <Link to={`/provas/${e.id}`}>
                    Começar <Icon name="arrow-up-right" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <section className="section">
        <Container className="benefits-grid">
          <div>
            <span className="eyebrow">CADA PASSO CONTA</span>
            <h2>
              Você cuida dos estudos.
              <br />A gente mostra o caminho.
            </h2>
            <p className="section-intro">
              Tenha clareza sobre sua preparação e construa uma rotina que cabe
              na sua vida.
            </p>
            <Link className="text-link" to="/entrar">
              Começar minha preparação <Icon name="arrow-right" />
            </Link>
          </div>
          <div className="benefit-list">
            {[
              [
                "bookmark-check",
                "Seu progresso fica com você",
                "Respostas salvas automaticamente no navegador. Saia e continue exatamente de onde parou.",
              ],
              [
                "pie-chart",
                "Uma visão clara da sua evolução",
                "Acompanhe questões respondidas, matérias estudadas e provas concluídas com dados do seu histórico.",
              ],
              [
                "shield-check",
                "Resultados com transparência",
                "Acertos são apresentados apenas quando há gabarito válido. Sem estimativas inventadas.",
              ],
            ].map(([icon, title, text]) => (
              <div className="benefit" key={title}>
                <span className="feature-icon">
                  <Icon name={icon} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="section plans-section">
        <Container>
          <div className="section-heading">
            <span className="eyebrow">INVISTA NO SEU PRÓXIMO CAPÍTULO</span>
            <h2>Um plano para o seu ritmo.</h2>
            <p>
              O mesmo conteúdo completo. Você escolhe o tempo de preparação.
            </p>
          </div>
          <PlanCards />
          <p className="small text-center mt-4 text-body-secondary">
            Contratação e pagamento realizados no Ecommerce. Preços e ofertas
            aguardam configuração.
          </p>
        </Container>
      </section>
      <section className="section">
        <Container className="faq-grid">
          <div>
            <span className="eyebrow">PODE PERGUNTAR</span>
            <h2>
              Antes de começar,
              <br />
              tire suas dúvidas.
            </h2>
            <p>Uma preparação com clareza, desde o primeiro dia.</p>
            <Link className="text-link" to="/contato">
              Fale com a gente <Icon name="arrow-up-right" />
            </Link>
          </div>
          <Accordion>
            {[
              [
                "O AprovaIF é uma plataforma oficial do IFTM?",
                "Não. O AprovaIF é um projeto independente de preparação e não representa oficialmente o IFTM.",
              ],
              [
                "Como funciona o acesso?",
                "Informe o email utilizado no Ecommerce. Consultamos os planos e liberamos o conteúdo quando a API confirma uma assinatura ativa. O email identifica a sessão experimental; não é autenticação segura.",
              ],
              [
                "Posso continuar uma prova depois?",
                "Sim. Suas respostas e posição são salvas neste navegador, separadas por email. O histórico não sincroniza entre dispositivos.",
              ],
              [
                "Todas as questões possuem gabarito?",
                "Nem sempre. Quando a fonte não disponibiliza um gabarito confiável, você pode praticar e registrar a resposta, mas a correção aparece como Não disponível.",
              ],
              [
                "Já paguei. Como volto a estudar?",
                "Volte à página Retorno de pagamento, informe o email da compra e clique em Já realizei meu pagamento. O acesso depende da confirmação da API.",
              ],
            ].map(([q, a], i) => (
              <Accordion.Item eventKey={String(i)} key={q}>
                <Accordion.Header>{q}</Accordion.Header>
                <Accordion.Body>{a}</Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </section>
      <Container>
        <div className="cta-banner">
          <div>
            <span className="eyebrow">SEU FUTURO MERECE ESSE PASSO</span>
            <h2>Vamos começar sua preparação?</h2>
            <p>Uma questão hoje pode fazer toda a diferença amanhã.</p>
          </div>
          <Link to="/entrar" className="btn btn-light btn-lg">
            Começar a estudar <Icon name="arrow-right" />
          </Link>
        </div>
      </Container>
    </>
  );
}
export function Login({ returning = false }) {
  const { email, subscription, check } = useStudent();
  const [value, setValue] = useState(email);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const submit = async (e) => {
    e.preventDefault();
    if (!validEmail(value)) {
      setError("Informe um email válido.");
      return;
    }
    setError("");
    const result = await check(normalizeEmail(value));
    if (result?.status === "active")
      navigate(location.state?.from || "/dashboard", { replace: true });
    else if (result?.status === "inactive") navigate("/planos");
  };
  return (
    <Container className="page login-grid">
      <div className="login-story">
        <span className="eyebrow">SUA PREPARAÇÃO COMEÇA AQUI</span>
        <h1>
          Um passo mais perto
          <br />
          do seu próximo capítulo.
        </h1>
        <p>Entre, encontre sua prova e continue construindo seu futuro.</p>
        <Icon name="mortarboard" />
      </div>
      <div className="form-card">
        <span className="feature-icon">
          <Icon name={returning ? "bag-check" : "person"} />
        </span>
        <h2>{returning ? "Voltou do pagamento?" : "Vamos começar?"}</h2>
        <p>
          {returning
            ? "Informe o email usado no Ecommerce para consultar sua assinatura."
            : "Use o email da sua assinatura para acessar a área do aluno."}
        </p>
        <Form onSubmit={submit}>
          <Form.Group controlId="student-email">
            <Form.Label>Seu email</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              required
              value={value}
              placeholder="voce@email.com"
              onChange={(e) => setValue(e.target.value)}
              disabled={subscription.status === "checking"}
            />
          </Form.Group>
          {(error || subscription.status === "error") && (
            <Alert className="mt-3" variant="danger">
              {error || subscription.message}
            </Alert>
          )}
          <Button
            className="w-100 mt-4"
            type="submit"
            disabled={subscription.status === "checking"}
          >
            {subscription.status === "checking"
              ? "Verificando assinatura…"
              : returning
                ? "Já realizei meu pagamento"
                : "Continuar"}{" "}
            <Icon name="arrow-right" />
          </Button>
        </Form>
        <p className="small mt-4">
          Sem senha neste MVP. O email identifica a sessão e não constitui
          autenticação segura.
        </p>
        <hr />
        <p className="mb-0 small">
          Ainda não tem assinatura? <Link to="/planos">Conheça os planos</Link>
        </p>
        {returning && (
          <Alert variant="info" className="mt-3">
            O retorno é manual. Somente a consulta à API confirma a ativação. Se
            ainda estiver inativa, aguarde o processamento e verifique
            novamente.
          </Alert>
        )}
      </div>
    </Container>
  );
}
export function Plans() {
  return (
    <Container className="page">
      <div className="section-heading">
        <span className="eyebrow">SEU OBJETIVO. SEU RITMO.</span>
        <h1>Escolha seu tempo de preparação.</h1>
        <p>
          Todos os planos dão acesso ao mesmo conteúdo. A diferença é apenas a
          duração.
        </p>
      </div>
      <PlanCards />
      <div className="info-panel mt-4">
        <Icon name="info-circle" />
        <div>
          O Ecommerce cuida do cadastro, checkout e pagamento. Depois da compra,{" "}
          <Link to="/assinatura/retorno">
            volte aqui para verificar sua assinatura
          </Link>
          . A renovação pode apresentar conflito HTTP 409; seu funcionamento
          ainda depende do Ecommerce.
        </div>
      </div>
    </Container>
  );
}
export function Institutional({ type }) {
  const content = {
    sobre: [
      "Preparação com propósito.",
      <>
        <p>
          O AprovaIF é uma plataforma educacional independente para estudantes
          que desejam se preparar para os processos seletivos do Instituto
          Federal do Triângulo Mineiro.
        </p>
        <p>
          Utilizamos questões de provas anteriores disponibilizadas pela API
          Questões Aqui. Nosso objetivo é facilitar a prática e tornar o
          progresso visível, com respeito aos dados disponíveis na fonte.
        </p>
        <p>
          Desenvolvido por SunSale System. Não utilizamos logotipos oficiais e
          não representamos oficialmente o IFTM.
        </p>
      </>,
    ],
    privacidade: [
      "Seus dados, com clareza.",
      <>
        <p>
          O email informado é enviado à API do Ecommerce com os códigos de
          oferta para verificar a assinatura. Ele permanece no sessionStorage
          durante a sessão e identifica seu histórico local.
        </p>
        <p>
          Respostas, matérias, posição e progresso ficam no localStorage deste
          navegador, separados por email. Não há banco de dados próprio,
          sincronização entre dispositivos ou senha. Quem tiver acesso ao
          navegador poderá acessar os dados locais.
        </p>
        <p>
          Sair encerra a identificação da sessão e preserva o histórico. Para
          removê-lo, apague os dados deste site nas configurações do navegador.
          Essa ação é irreversível.
        </p>
        <p>
          Requisições de questões e imagens são feitas aos servidores de origem.
          O Ecommerce mantém seus próprios termos e política de privacidade para
          cadastro e pagamento.
        </p>
      </>,
    ],
    contato: [
      "Vamos conversar.",
      <>
        <p>O canal de contato do projeto ainda precisa ser configurado.</p>
        {import.meta.env.VITE_CONTACT_EMAIL && (
          <a
            className="btn btn-primary"
            href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}
          >
            Enviar email
          </a>
        )}
        <p>
          Dúvidas de cadastro, cobrança, pagamento ou conflito de renovação
          devem ser encaminhadas ao suporte do Ecommerce usado na contratação.
        </p>
        <Link to="/assinatura/retorno">Já realizei meu pagamento</Link>
      </>,
    ],
  };
  const [title, body] = content[type];
  return (
    <Container className="page narrow">
      <span className="eyebrow">APROVAIF · {type.toUpperCase()}</span>
      <h1>{title}</h1>
      <div className="content-card mt-4">{body}</div>
    </Container>
  );
}
