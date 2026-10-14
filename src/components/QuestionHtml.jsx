import DOMPurify from "dompurify";
import { useMemo } from "react";
import { safeUrl } from "../utils/normalize";
export function prepareHtml(html, attachments = []) {
  const doc = new DOMParser().parseFromString(
    DOMPurify.sanitize(String(html || ""), {
      FORBID_TAGS: ["style", "form", "input", "button", "iframe"],
      FORBID_ATTR: ["style"],
    }),
    "text/html",
  );
  const used = new Set();
  let index = 0;
  doc.querySelectorAll("img").forEach((img) => {
    let src = safeUrl(img.getAttribute("src"));
    if (!src) {
      const match = img.id.match(/^divAnexo(\d+)$/);
      const i = match ? Number(match[1]) : index++;
      src = safeUrl(attachments[i]);
    }
    if (!src || used.has(src)) {
      img.replaceWith(doc.createTextNode(src ? "" : "[Imagem indisponível]"));
      return;
    }
    used.add(src);
    img.src = src;
    img.alt = img.alt || "Anexo da questão";
    img.loading = "lazy";
    img.removeAttribute("id");
  });
  attachments.forEach((url) => {
    const src = safeUrl(url);
    if (!src || used.has(src)) return;
    const img = doc.createElement("img");
    img.src = src;
    img.alt = "Anexo da questão";
    img.loading = "lazy";
    doc.body.appendChild(img);
    used.add(src);
  });
  doc.querySelectorAll("a").forEach((a) => {
    if (!safeUrl(a.getAttribute("href"))) a.removeAttribute("href");
    a.setAttribute("rel", "noopener noreferrer");
    a.setAttribute("target", "_blank");
  });
  return DOMPurify.sanitize(doc.body.innerHTML);
}
export function QuestionHtml({ html, attachments }) {
  const content = useMemo(
    () => prepareHtml(html, attachments),
    [html, attachments],
  );
  return (
    <div
      className="question-html"
      dangerouslySetInnerHTML={{ __html: content }}
      onErrorCapture={(event) => {
        if (event.target.tagName === "IMG") {
          const fallback = document.createElement("span");
          fallback.className = "image-fallback";
          fallback.textContent =
            "Imagem indisponível. Tente recarregar a prova.";
          event.target.replaceWith(fallback);
        }
      }}
    />
  );
}
