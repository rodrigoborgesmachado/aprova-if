import { useEffect, useRef, useState } from "react";
import { getAnswer } from "../services/questoesService";

export function useAnswerVerification(examId, saveExam) {
  const requests = useRef(new Map());
  const [checks, setChecks] = useState({});

  const cancelAll = () => {
    requests.current.forEach((request) => request.abort());
    requests.current.clear();
  };
  useEffect(() => {
    setChecks({});
    return cancelAll;
  }, [examId]);

  const selectAnswer = async (questionId, alternativeId) => {
    requests.current.get(questionId)?.abort();
    const controller = new AbortController();
    requests.current.set(questionId, controller);
    const answeredAt = new Date().toISOString();
    const saved = saveExam(examId, (exam) => ({
      ...exam,
      updatedAt: answeredAt,
      answers: {
        ...exam.answers,
        [questionId]: {
          alternativeId,
          answeredAt,
          correctionStatus: "unknown",
        },
      },
    }));
    setChecks((state) => ({
      ...state,
      [questionId]: { loading: true, error: "", saved },
    }));
    try {
      const correctionStatus = await getAnswer(
        alternativeId,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        requests.current.get(questionId) !== controller
      )
        return;
      const persisted = saveExam(examId, (exam) => {
        // A newer choice (including one made in another tab) must remain untouched.
        const answer = exam?.answers[questionId];
        if (
          !answer ||
          answer.alternativeId !== alternativeId ||
          answer.answeredAt !== answeredAt
        )
          return exam;
        return {
          ...exam,
          answers: {
            ...exam.answers,
            [questionId]: {
              ...answer,
              correctionStatus,
              correctionSource: "GetResposta",
              correctedAt: new Date().toISOString(),
            },
          },
        };
      });
      setChecks((state) => ({
        ...state,
        [questionId]: { loading: false, error: "", saved: saved && persisted },
      }));
    } catch {
      if (
        controller.signal.aborted ||
        requests.current.get(questionId) !== controller
      )
        return;
      setChecks((state) => ({
        ...state,
        [questionId]: {
          loading: false,
          saved,
          error: "Não foi possível verificar esta resposta. Tente novamente.",
        },
      }));
    } finally {
      if (requests.current.get(questionId) === controller)
        requests.current.delete(questionId);
    }
  };
  const resetChecks = () => {
    cancelAll();
    setChecks({});
  };
  return { checks, selectAnswer, resetChecks };
}
