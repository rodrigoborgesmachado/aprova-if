import axios from "axios";
import { config } from "../config/plans";
import { attachmentUrls } from "../utils/normalize";
const client = axios.create({ baseURL: config.questionsUrl, timeout: 20000 });
export function normalizeExam(e) {
  return {
    id: String(e.Id),
    name: e.nomeProva || "Prova IFTM",
    year: String(e.dataAplicacao || "Não informado"),
    location: e.local || "Não informado",
    type: e.tipoProva || "Prova",
    total: Number(e.quantidadeQuestoesTotal) || 0,
  };
}
export async function listExams(signal) {
  let page = 1,
    result = [],
    total = Infinity;
  while (result.length < total) {
    const { data } = await client.get("/provas-pagged", {
      params: { page, quantity: 100, bancas: "IFTM" },
      signal,
    });
    if (data.success === false || !Array.isArray(data.object))
      throw new Error("Formato de catálogo inválido.");
    result.push(...data.object.map(normalizeExam));
    total = Number(data.total) || result.length;
    if (data.object.length === 0) break;
    page++;
    if (page > 100)
      throw new Error(
        "O catálogo excedeu o limite de paginação. Tente novamente.",
      );
  }
  return [...new Map(result.map((e) => [e.id, e])).values()];
}
export function normalizeQuestion(q) {
  return {
    id: String(q.Id),
    number: q.numeroQuestao,
    subject: q.materia || "Não informada",
    topic: q.assunto || "",
    html: q.campoQuestao || "",
    observation: q.observacaoQuestao || "",
    attachments: attachmentUrls(q.anexosQuestoes),
    exam: q.prova,
    alternatives: (q.respostasQuestoes || []).map((a) => ({
      id: String(a.codigo),
      html: a.textoResposta || "",
      attachments: attachmentUrls(a.anexoResposta),
    })),
  };
}
export async function getAnswer(alternativeId, signal) {
  const { data } = await client.get("/GetResposta", {
    params: { codigoResposta: alternativeId },
    signal,
  });
  if (typeof data?.correta !== "boolean")
    throw new Error("A API retornou uma correção inválida.");
  return data.correta ? "correct" : "incorrect";
}
export async function getQuestions(id, signal) {
  const { data } = await client.get("/GetQuestoes", {
    params: { codigoProva: id },
    signal,
  });
  const rows = Array.isArray(data) ? data : data.object;
  if (!Array.isArray(rows) || data.success === false)
    throw new Error("Formato de questões inválido.");
  return rows
    .map(normalizeQuestion)
    .sort((a, b) => Number(a.number) - Number(b.number));
}
