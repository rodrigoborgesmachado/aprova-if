import { expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { prepareHtml, QuestionHtml } from "../components/QuestionHtml";
it("associa placeholders indexados, mantém ordem e evita anexos duplicados", () => {
  const urls = ["https://example.com/a.png", "https://example.com/b.png"];
  const html = prepareHtml(
    '<p>Texto</p><img src="#" alt="Anexo" id="divAnexo1"><img src="#" id="divAnexo0">',
    urls,
  );
  const doc = new DOMParser().parseFromString(html, "text/html");
  expect([...doc.images].map((i) => i.src)).toEqual([urls[1], urls[0]]);
});
it("sanitiza scripts, handlers e links perigosos preservando conteúdo educacional", () => {
  const html = prepareHtml(
    '<script>alert(1)</script><p onclick="alert(1)">H<sub>2</sub>O <b>texto</b> x<sup>2</sup></p><img src="javascript:alert(1)" onerror="alert(1)"><a href="javascript:alert(1)">link</a><table><tr><td>1</td></tr></table>',
  );
  expect(html).not.toMatch(/script|onclick|onerror|javascript/);
  expect(html).toContain("<sub>2</sub>");
  expect(html).toContain("<sup>2</sup>");
  expect(html).toContain("<table>");
});
it("renderiza anexos sem placeholder e das alternativas", () => {
  render(
    <QuestionHtml
      html="Alternativa"
      attachments={["https://example.com/a.png"]}
    />,
  );
  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    "https://example.com/a.png",
  );
});
it("mostra fallback após erro da imagem", () => {
  render(<QuestionHtml html="" attachments={["https://example.com/a.png"]} />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByText(/Imagem indisponível/)).toBeInTheDocument();
});
