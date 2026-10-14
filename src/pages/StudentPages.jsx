import { useState } from "react";
import {
  Alert,
  Button,
  Container,
  Form,
  ProgressBar,
  Table,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useStudent } from "../context/StudentContext";
import { performance } from "../utils/performance";
import { formatDate } from "../utils/normalize";
import { listExams } from "../services/questoesService";
import { useResource } from "../hooks/useResource";
import { Empty, Icon, ResourceState } from "../components/UI";
const statusLabel = (status) =>
  status === "completed"
    ? "Concluída"
    : status === "in_progress"
      ? "Em andamento"
      : "Não iniciada";
export function Metrics({ stats, full = false }) {
  const items = [
    ["journal-check", "Questões respondidas", stats.answered],
    ["collection", "Provas iniciadas", stats.started],
    ["check2-circle", "Provas concluídas", stats.completed],
    [
      "bullseye",
      "Taxa de acerto",
      stats.accuracy === null ? "—" : `${stats.accuracy}%`,
    ],
  ];
  if (full)
    items.push(
      ["hourglass-split", "Questões pendentes", stats.pending],
      ["check-circle", "Acertos confirmados", stats.correct],
      ["x-circle", "Erros confirmados", stats.incorrect],
      ["question-circle", "Sem gabarito", stats.unknown],
    );
  return (
    <div className="metrics-grid">
      {items.map(([icon, title, value]) => (
        <article className="metric-card" key={title}>
          <span className="feature-icon">
            <Icon name={icon} />
          </span>
          <span>{title}</span>
          <strong>{value}</strong>
          {title === "Taxa de acerto" && (
            <small>Somente com correção disponível</small>
          )}
        </article>
      ))}
    </div>
  );
}
export function Dashboard() {
  const { email, subscription, progress } = useStudent();
  const stats = performance(progress.exams);
  const last = Object.entries(progress.exams)
    .filter(([, e]) => e.status === "in_progress")
    .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))[0];
  return (
    <Container className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU ESPAÇO DE APRENDIZADO</span>
          <h1>
            Bom te ver por aqui <span className="wave">✦</span>
          </h1>
          <p className="email-text">{email}</p>
        </div>
        <span className="badge-soft">
          <Icon name="check-circle" /> Plano {subscription.plan.name} · Até{" "}
          {formatDate(subscription.expiresAt)}
        </span>
      </div>
      <div className="student-banner">
        <div>
          <span className="eyebrow">UM PASSO DE CADA VEZ</span>
          <h2>Seu próximo capítulo começa hoje.</h2>
          <p>Escolha uma prova e transforme a sua preparação em progresso.</p>
        </div>
        <Link className="btn btn-light" to="/provas">
          Explorar provas <Icon name="arrow-right" />
        </Link>
      </div>
      <Metrics stats={stats} />
      <div className="dashboard-grid">
        <article className="content-card">
          <h3>
            <Icon name="bookmark" /> Continue sua preparação
          </h3>
          {last ? (
            <>
              <span className="badge-soft">Em andamento</span>
              <h2 className="mt-3">{last[1].exam.name}</h2>
              <p>
                {Object.keys(last[1].answers).length} de {last[1].exam.total}{" "}
                questões respondidas
              </p>
              <ProgressBar
                now={
                  (Object.keys(last[1].answers).length / last[1].exam.total) *
                  100
                }
              />
              <Link className="btn btn-primary mt-4" to={`/provas/${last[0]}`}>
                Continuar prova <Icon name="arrow-right" />
              </Link>
            </>
          ) : (
            <Empty title="Seu primeiro passo está esperando">
              Ao iniciar uma prova, você poderá continuá-la por aqui.
            </Empty>
          )}
        </article>
        <article className="content-card">
          <h3>Seu progresso geral</h3>
          <div className="progress-number">
            {stats.progress}
            <span>%</span>
          </div>
          <ProgressBar now={stats.progress} />
          <p className="small mt-3">
            Questões respondidas nas provas que você iniciou.
          </p>
          <Link to="/desempenho" className="text-link">
            Ver meu desempenho <Icon name="arrow-right" />
          </Link>
        </article>
      </div>
      <div className="info-panel mt-4">
        <Icon name="laptop" />
        Seu histórico fica salvo somente neste navegador e dispositivo, separado
        por email.
      </div>
    </Container>
  );
}
export function Exams() {
  const resource = useResource(listExams);
  const { progress } = useStudent();
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("desc");
  const exams = resource.data || [];
  const filtered = exams
    .filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) &&
        (!year || year === e.year) &&
        (!location || location === e.location),
    )
    .sort((a, b) =>
      sort === "desc"
        ? b.year.localeCompare(a.year)
        : a.year.localeCompare(b.year),
    );
  return (
    <Container className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PRÁTICA QUE APROXIMA</span>
          <h1>Encontre sua próxima prova.</h1>
          <p>Provas anteriores do IFTM para estudar no seu ritmo.</p>
        </div>
        <span className="badge-soft">{exams.length} provas disponíveis</span>
      </div>
      <div className="filters">
        <Form.Group controlId="exam-search">
          <Form.Label>Buscar prova</Form.Label>
          <Form.Control
            type="search"
            placeholder="Nome da prova…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="exam-year">
          <Form.Label>Ano de aplicação</Form.Label>
          <Form.Select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Todos os anos</option>
            {[...new Set(exams.map((e) => e.year))]
              .sort()
              .reverse()
              .map((y) => (
                <option key={y}>{y}</option>
              ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="exam-location">
          <Form.Label>Local</Form.Label>
          <Form.Select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Todos os locais</option>
            {[...new Set(exams.map((e) => e.location))].sort().map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="exam-sort">
          <Form.Label>Ordenar</Form.Label>
          <Form.Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigas</option>
          </Form.Select>
        </Form.Group>
      </div>
      <ResourceState resource={resource} />
      {!resource.loading && !resource.error && !filtered.length && (
        <Empty title="Nenhuma prova encontrada">
          Tente ajustar a busca e os filtros.
        </Empty>
      )}
      <div className="exam-grid">
        {filtered.map((e) => {
          const saved = progress.exams[e.id];
          const answered = Object.keys(saved?.answers || {}).length;
          const total = saved?.exam.total || e.total;
          return (
            <article className="exam-card" key={e.id}>
              <div className="exam-card-top">
                <span className="feature-icon">
                  <Icon name="file-earmark-text" />
                </span>
                <span className="badge-soft">{e.year}</span>
              </div>
              <h3>{e.name}</h3>
              <p>
                <Icon name="geo-alt" /> {e.location} · {e.type}
              </p>
              <div className="progress-label">
                <span>{statusLabel(saved?.status)}</span>
                <span>
                  {answered}/{total}
                </span>
              </div>
              <ProgressBar now={total ? (answered / total) * 100 : 0} />
              <div className="exam-card-bottom">
                <span>{total} questões</span>
                <Link to={`/provas/${e.id}`}>
                  {saved?.status === "completed"
                    ? "Revisar"
                    : saved
                      ? "Continuar"
                      : "Começar"}{" "}
                  <Icon name="arrow-right" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </Container>
  );
}
function ChartCard({ title, children, empty }) {
  return (
    <article className="content-card chart-card">
      <h3>{title}</h3>
      {empty ? (
        <Empty title="Ainda sem dados">
          Responda questões para acompanhar este indicador.
        </Empty>
      ) : (
        <div className="chart-wrap">{children}</div>
      )}
    </article>
  );
}
export function Performance() {
  const { progress } = useStudent();
  const [exam, setExam] = useState("");
  const [subject, setSubject] = useState("");
  const stats = performance(progress.exams, exam, subject);
  const subjects = [
    ...new Set(
      Object.values(progress.exams).flatMap((e) =>
        (e.questions || []).map((q) => q.subject),
      ),
    ),
  ].sort();
  const distribution = [
    { name: "Acertos", value: stats.correct },
    { name: "Erros", value: stats.incorrect },
    { name: "Sem gabarito", value: stats.unknown },
    { name: "Pendentes", value: stats.pending },
  ].filter((d) => d.value);
  return (
    <Container className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CADA QUESTÃO CONTA</span>
          <h1>Veja o quanto você já avançou.</h1>
          <p>Seu desempenho, com dados reais da sua preparação.</p>
        </div>
        <Link className="btn btn-outline-primary" to="/provas">
          Continuar estudando <Icon name="arrow-right" />
        </Link>
      </div>
      <div className="filters performance-filters">
        <Form.Group controlId="performance-exam">
          <Form.Label>Prova</Form.Label>
          <Form.Select value={exam} onChange={(e) => setExam(e.target.value)}>
            <option value="">Todas as provas</option>
            {Object.entries(progress.exams).map(([id, e]) => (
              <option value={id} key={id}>
                {e.exam.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="performance-subject">
          <Form.Label>Matéria</Form.Label>
          <Form.Select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Todas as matérias</option>
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>
      <Metrics stats={stats} full />
      <div className="info-panel">
        <Icon name="info-circle" />
        Progresso geral: {stats.progress}%. Questões sem gabarito não contam
        como erros e não entram na taxa de acerto.
      </div>
      <div className="charts-grid mt-4">
        <ChartCard
          title="Questões respondidas por matéria"
          empty={!stats.subjects.length}
        >
          <ResponsiveContainer>
            <BarChart data={stats.subjects}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                name="Respondidas"
                dataKey="answered"
                fill="#158564"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Acertos e erros por matéria"
          empty={stats.correct + stats.incorrect === 0}
        >
          <ResponsiveContainer>
            <BarChart data={stats.subjects}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar name="Acertos" dataKey="correct" fill="#158564" />
              <Bar name="Erros" dataKey="incorrect" fill="#df775a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Progresso por prova" empty={!stats.rows.length}>
          <ResponsiveContainer>
            <BarChart data={stats.rows}>
              <XAxis dataKey="name" hide />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Bar
                name="Progresso (%)"
                dataKey="progress"
                fill="#158564"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Evolução das respostas" empty={!stats.dates.length}>
          <ResponsiveContainer>
            <LineChart data={stats.dates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                name="Respostas no dia"
                dataKey="answered"
                stroke="#158564"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Distribuição de status das questões"
          empty={!distribution.length}
        >
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
              >
                {distribution.map((d, i) => (
                  <Cell
                    fill={["#158564", "#df775a", "#95a6d5", "#dce3e0"][i]}
                    key={d.name}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <article className="content-card mt-4">
        <h3>Seu histórico por prova</h3>
        {!stats.rows.length ? (
          <Empty title="Seu histórico começa na primeira prova">
            Escolha uma prova para começar sua preparação.
          </Empty>
        ) : (
          <Table responsive className="performance-table">
            <thead>
              <tr>
                {[
                  "Prova",
                  "Total",
                  "Respondidas",
                  "Pendentes",
                  "Acertos",
                  "Erros",
                  "Conclusão",
                  "Situação",
                ].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/provas/${r.id}`}>{r.name}</Link>
                  </td>
                  <td>{r.total}</td>
                  <td>{r.answered}</td>
                  <td>{r.pending}</td>
                  <td>{r.correct}</td>
                  <td>{r.incorrect}</td>
                  <td>{r.progress}%</td>
                  <td>{statusLabel(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </article>
      <p className="small text-body-secondary mt-3">
        A evolução usa a data da última resposta salva de cada questão.
        Reiniciar uma prova substitui a tentativa atual.
      </p>
    </Container>
  );
}
export function Subscription() {
  const { email, subscription, check } = useStudent();
  return (
    <Container className="page narrow">
      <span className="eyebrow">SEU ACESSO À PREPARAÇÃO</span>
      <h1>Minha assinatura</h1>
      <article className="content-card mt-4">
        <span className="badge-soft">
          <Icon name="check-circle" /> Assinatura ativa
        </span>
        <dl className="subscription-details">
          <dt>Email</dt>
          <dd>{email}</dd>
          <dt>Plano</dt>
          <dd>
            {subscription.plan.name} · {subscription.plan.durationMonths} meses
          </dd>
          <dt>Vencimento</dt>
          <dd>{formatDate(subscription.expiresAt)}</dd>
          <dt>Última verificação</dt>
          <dd>{new Date(subscription.verifiedAt).toLocaleString("pt-BR")}</dd>
        </dl>
        <div className="d-flex gap-3 flex-wrap">
          <Button onClick={() => check()}>
            <Icon name="arrow-clockwise" /> Atualizar status
          </Button>
          <Link className="btn btn-outline-primary" to="/planos">
            Escolher outro plano
          </Link>
        </div>
      </article>
      <Alert variant="info" className="mt-4">
        Cadastro e pagamento são gerenciados pelo Ecommerce. Após uma compra,
        volte à <Link to="/assinatura/retorno">verificação de pagamento</Link>.
        A renovação pode retornar HTTP 409 e ainda depende de ajustes no
        Ecommerce.
      </Alert>
    </Container>
  );
}
