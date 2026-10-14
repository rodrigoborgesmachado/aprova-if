import { useEffect, useState } from "react";
import { Alert, Button, Container, ProgressBar } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { useStudent } from "../context/StudentContext";
import { useResource } from "../hooks/useResource";
import { useAnswerVerification } from "../hooks/useAnswerVerification";
import { getQuestions, normalizeExam } from "../services/questoesService";
import { startExam } from "../services/storageService";
import { QuestionHtml } from "../components/QuestionHtml";
import { Confirm, Empty, Icon, ResourceState } from "../components/UI";
export default function ExamPage() {
  const { id } = useParams();
  const resource = useResource((signal) => getQuestions(id, signal), id);
  const { progress, saveExam } = useStudent();
  const [confirmation, setConfirmation] = useState("");
  const { checks, selectAnswer, resetChecks } = useAnswerVerification(
    id,
    saveExam,
  );
  const questions = resource.data || [];
  const saved = progress.exams[id];
  useEffect(() => {
    if (!questions.length) return;
    const exam = questions[0].exam
      ? normalizeExam(questions[0].exam)
      : { id, name: `Prova ${id}`, total: questions.length };
    saveExam(id, (current) => startExam(current, exam, questions));
  }, [resource.data, id]);
  if (resource.loading || resource.error)
    return (
      <Container className="page">
        <ResourceState resource={resource} />
      </Container>
    );
  if (!questions.length)
    return (
      <Container className="page">
        <Empty title="Esta prova ainda não possui questões">
          Volte ao catálogo e escolha outra prova.
        </Empty>
        <Link to="/provas">Voltar às provas</Link>
      </Container>
    );
  if (!saved)
    return (
      <Container className="page">
        <Alert variant="warning">
          Não foi possível iniciar a prova. Verifique a disponibilidade do
          armazenamento do navegador.
        </Alert>
      </Container>
    );
  const index = Math.max(
    0,
    questions.findIndex((q) => q.id === saved.currentQuestionId),
  );
  const q = questions[index];
  const answer = saved.answers[q.id];
  const check = checks[q.id];
  const completed = saved.status === "completed";
  const count = Object.keys(saved.answers).filter((id) =>
    questions.some((q) => q.id === id),
  ).length;
  const go = (i) =>
    saveExam(id, (e) => ({
      ...e,
      currentQuestionId: questions[i].id,
      updatedAt: new Date().toISOString(),
    }));
  const confirm = () => {
    if (confirmation === "finish")
      saveExam(id, (e) => ({
        ...e,
        status: "completed",
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    else {
      resetChecks();
      saveExam(id, () => startExam(null, saved.exam, questions));
    }
    setConfirmation("");
  };
  return (
    <Container className="page exam-page">
      <Link className="back-link" to="/provas">
        <Icon name="arrow-left" /> Voltar às provas
      </Link>
      <div className="page-heading mt-4">
        <div>
          <span className="eyebrow">
            {completed ? "MODO REVISÃO" : "SEU MOMENTO DE PRÁTICA"}
          </span>
          <h1>{saved.exam.name}</h1>
          <p>
            {count} de {questions.length} questões respondidas ·{" "}
            {Math.round((count / questions.length) * 100)}% de progresso
          </p>
        </div>
        <Button
          variant="outline-primary"
          onClick={() => setConfirmation(completed ? "restart" : "finish")}
        >
          {completed ? "Reiniciar prova" : "Finalizar prova"}
        </Button>
      </div>
      <ProgressBar now={(count / questions.length) * 100} className="mb-4" />
      <div className="solver-grid">
        <article className="content-card question-card">
          <div className="question-top">
            <span className="badge-soft">{q.subject}</span>
            <span>
              Questão {q.number || index + 1} de {questions.length}
            </span>
          </div>
          {q.topic && <p className="small text-body-secondary">{q.topic}</p>}
          <QuestionHtml html={q.html} attachments={q.attachments} />
          {q.observation && (
            <div className="question-observation">
              <QuestionHtml html={q.observation} />
            </div>
          )}
          <fieldset className="alternatives">
            <legend>
              {completed ? "Sua resposta" : "Selecione uma alternativa"}
            </legend>
            {q.alternatives.map((a, i) => (
              <label
                className={`alternative ${answer?.alternativeId === a.id ? `selected ${answer.correctionStatus}` : ""}`}
                key={a.id}
              >
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  value={a.id}
                  checked={answer?.alternativeId === a.id}
                  disabled={completed}
                  onChange={() => selectAnswer(q.id, a.id)}
                  onClick={() => {
                    if (answer?.alternativeId === a.id)
                      selectAnswer(q.id, a.id);
                  }}
                />
                <span className="alternative-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <QuestionHtml html={a.html} attachments={a.attachments} />
              </label>
            ))}
          </fieldset>
          {!q.alternatives.length && (
            <Alert variant="warning">
              Esta questão não possui alternativas disponíveis.
            </Alert>
          )}
          <div className="save-notice" role="status">
            {check?.saved && !completed && (
              <>
                <Icon name="cloud-check" /> Resposta salva neste navegador.
              </>
            )}
          </div>
          {check?.loading && (
            <div className="mb-3" role="status">
              Verificando resposta…
            </div>
          )}
          {check?.error && (
            <Alert variant="warning">
              {check.error}
              <Button
                variant="outline-primary"
                className="ms-2"
                disabled={!answer}
                onClick={() => selectAnswer(q.id, answer.alternativeId)}
              >
                Verificar novamente
              </Button>
            </Alert>
          )}
          {!check?.loading && !check?.error && (answer || completed) && (
            <Alert
              variant={
                answer?.correctionStatus === "correct"
                  ? "success"
                  : answer?.correctionStatus === "incorrect"
                    ? "danger"
                    : "secondary"
              }
            >
              {!answer ? (
                "Questão não respondida."
              ) : answer.correctionStatus === "correct" ? (
                "Resposta correta."
              ) : answer.correctionStatus === "incorrect" ? (
                "Resposta incorreta."
              ) : (
                <>
                  Correção: Não disponível. A resposta ainda não foi verificada.
                  {answer && (
                    <Button
                      variant="outline-primary"
                      className="ms-2"
                      onClick={() => selectAnswer(q.id, answer.alternativeId)}
                    >
                      Verificar resposta
                    </Button>
                  )}
                </>
              )}
            </Alert>
          )}
          <div className="question-navigation">
            <Button
              variant="outline-primary"
              disabled={index === 0}
              onClick={() => {
                go(index - 1);
              }}
            >
              <Icon name="arrow-left" /> Anterior
            </Button>
            <span>
              {index + 1} / {questions.length}
            </span>
            <Button
              disabled={index === questions.length - 1}
              onClick={() => {
                go(index + 1);
              }}
            >
              Próxima <Icon name="arrow-right" />
            </Button>
          </div>
        </article>
        <aside className="content-card question-sidebar">
          <h3>Seu mapa da prova</h3>
          <p className="small">Você pode responder em qualquer ordem.</p>
          <div className="question-map">
            {questions.map((question, i) => (
              <button
                key={question.id}
                className={`${saved.answers[question.id] ? "answered" : ""} ${i === index ? "current" : ""}`}
                aria-label={`Questão ${i + 1}, ${saved.answers[question.id] ? "respondida" : "pendente"}`}
                aria-current={i === index ? "step" : undefined}
                onClick={() => {
                  go(i);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="map-legend">
            <span>
              <i /> Pendente
            </span>
            <span>
              <i className="answered" /> Respondida
            </span>
          </div>
          <hr />
          <p className="small">
            <Icon name="bookmark-check" /> Suas respostas são salvas
            automaticamente neste navegador.
          </p>
          {!completed && (
            <Button
              variant="outline-primary"
              className="w-100"
              onClick={() => setConfirmation("finish")}
            >
              Finalizar prova
            </Button>
          )}
          {completed && (
            <Link className="btn btn-primary w-100" to="/desempenho">
              Ver desempenho
            </Link>
          )}
        </aside>
      </div>
      <Confirm
        show={!!confirmation}
        title={
          confirmation === "finish"
            ? "Finalizar esta prova?"
            : "Reiniciar esta prova?"
        }
        onHide={() => setConfirmation("")}
        onConfirm={confirm}
        label={
          confirmation === "finish" ? "Finalizar prova" : "Reiniciar prova"
        }
      >
        {confirmation === "finish" ? (
          <>
            Você respondeu {count} de {questions.length} questões.{" "}
            {count < questions.length &&
              `${questions.length - count} questões ficarão sem resposta.`}{" "}
            Após finalizar, a prova ficará disponível para revisão.
          </>
        ) : (
          "As respostas e o progresso desta tentativa serão substituídos. Essa ação não pode ser desfeita."
        )}
      </Confirm>
    </Container>
  );
}
