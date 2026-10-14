import { normalizeEmail } from "../utils/normalize";
import { correction } from "../utils/normalize";
const key = (email) => `aprovaif:v1:${normalizeEmail(email)}`;
export function loadProgress(email) {
  const raw = localStorage.getItem(key(email));
  if (!raw) return { version: 1, email: normalizeEmail(email), exams: {} };
  try {
    const data = JSON.parse(raw);
    if (
      data.version !== 1 ||
      !data.exams ||
      data.email !== normalizeEmail(email)
    )
      throw new Error();
    return data;
  } catch {
    throw new Error(
      "O histórico local está em um formato inválido. Ele foi preservado; não será sobrescrito.",
    );
  }
}
export function updateExam(email, id, updater) {
  const data = loadProgress(email);
  data.exams[id] = updater(data.exams[id]);
  localStorage.setItem(key(email), JSON.stringify(data));
  return data;
}
export function startExam(existing, exam, questions) {
  const now = new Date().toISOString();
  const answers = { ...existing?.answers };
  questions.forEach((q) => {
    if (answers[q.id] && q.alternatives)
      answers[q.id] = {
        ...answers[q.id],
        correctionStatus: correction(q, answers[q.id].alternativeId),
      };
  });
  return {
    status: "in_progress",
    startedAt: now,
    finishedAt: null,
    currentQuestionId: questions[0]?.id,
    ...existing,
    answers,
    updatedAt: now,
    exam: { ...exam, total: questions.length },
    questions: questions.map((q) => ({ id: q.id, subject: q.subject })),
  };
}
