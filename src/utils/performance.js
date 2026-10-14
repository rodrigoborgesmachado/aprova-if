export function performance(exams, examFilter = "", subjectFilter = "") {
  const rows = Object.entries(exams)
    .filter(([id]) => !examFilter || id === examFilter)
    .map(([id, e]) => {
      const questions = (e.questions || []).filter(
        (q) => !subjectFilter || q.subject === subjectFilter,
      );
      const answers = questions.map((q) => e.answers[q.id]).filter(Boolean);
      const correct = answers.filter(
        (a) => a.correctionStatus === "correct",
      ).length;
      const incorrect = answers.filter(
        (a) => a.correctionStatus === "incorrect",
      ).length;
      return {
        id,
        name: e.exam.name,
        status: e.status,
        total: questions.length,
        answered: answers.length,
        pending: questions.length - answers.length,
        correct,
        incorrect,
        unknown: answers.length - correct - incorrect,
        progress: questions.length
          ? Math.round((answers.length / questions.length) * 100)
          : 0,
      };
    });
  const sum = (field) => rows.reduce((s, r) => s + r[field], 0);
  const subjects = {},
    dates = {};
  Object.entries(exams)
    .filter(([id]) => !examFilter || id === examFilter)
    .forEach(([, e]) =>
      (e.questions || []).forEach((q) => {
        if (subjectFilter && q.subject !== subjectFilter) return;
        const a = e.answers[q.id];
        if (!a) return;
        subjects[q.subject] ||= {
          name: q.subject,
          answered: 0,
          correct: 0,
          incorrect: 0,
        };
        subjects[q.subject].answered++;
        if (a.correctionStatus !== "unknown")
          subjects[q.subject][a.correctionStatus]++;
        const date = a.answeredAt.slice(0, 10);
        dates[date] = (dates[date] || 0) + 1;
      }),
    );
  return {
    rows,
    answered: sum("answered"),
    pending: sum("pending"),
    correct: sum("correct"),
    incorrect: sum("incorrect"),
    unknown: sum("unknown"),
    started: rows.length,
    completed: rows.filter((r) => r.status === "completed").length,
    progress: sum("total")
      ? Math.round((sum("answered") / sum("total")) * 100)
      : 0,
    accuracy:
      sum("correct") + sum("incorrect")
        ? Math.round(
            (sum("correct") / (sum("correct") + sum("incorrect"))) * 100,
          )
        : null,
    subjects: Object.values(subjects),
    dates: Object.entries(dates)
      .sort()
      .map(([name, answered]) => ({ name, answered })),
  };
}
