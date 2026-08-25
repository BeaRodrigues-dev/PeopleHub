"use strict";
/**
 * Este servidor mock não tem `pdf-parse`/`mammoth` disponíveis (sem acesso a
 * npm neste ambiente), então não lê o conteúdo binário real do PDF/DOCX.
 * Em vez disso, gera um texto de currículo plausível a partir do nome do
 * arquivo — o suficiente para exercitar o fluxo completo (upload → extração
 * via IA → tela de confirmação → criação do candidato) de ponta a ponta.
 * O backend real (backend/src) faz a extração de verdade.
 */
const SAMPLE_SKILLS = ["React", "TypeScript", "Node.js", "SQL", "Figma", "Python", "AWS", "Liderança", "Scrum"];
const SENIORITY_WORDS = ["Sênior", "Pleno", "Júnior", "Especialista"];

function titleCaseFromFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  if (!base) return "Candidato";
  return base
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function buildSyntheticResumeText(filename) {
  const name = titleCaseFromFilename(filename) || "Candidato Sem Nome";
  const emailSlug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
  const seed = filename.length + name.length;
  const skills = Array.from({ length: 4 }, (_, i) => SAMPLE_SKILLS[(seed + i * 3) % SAMPLE_SKILLS.length]);
  const seniority = SENIORITY_WORDS[seed % SENIORITY_WORDS.length];

  return [
    name,
    `${emailSlug}@email.com`,
    `+55 11 9${String(10000000 + seed).padStart(8, "0")}`,
    "",
    `Profissional ${seniority} com sólida experiência em ${skills.join(", ")}.`,
    "Experiência: atuação em projetos de alto impacto, colaborando com times multidisciplinares.",
    `Competências: ${skills.join(", ")}.`,
    "Formação: Bacharelado em área correlata.",
    "Idiomas: Português, Inglês.",
    "linkedin.com/in/" + emailSlug,
  ].join("\n");
}

module.exports = { buildSyntheticResumeText };
