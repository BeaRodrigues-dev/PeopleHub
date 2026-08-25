import type { MatchInputCandidate, MatchInputVacancy } from "../interfaces/ai-provider.interface";

/**
 * Prompt de avaliação de aderência candidato x vaga. Pede um veredito
 * estruturado e auditável (pontos fortes, lacunas, recomendação e
 * justificativa), salvo depois em Application.aiEvaluation.
 */
export function buildMatchPrompt(vacancy: MatchInputVacancy, candidate: MatchInputCandidate): { system: string; user: string } {
  const system = `Você é um recrutador técnico sênior avaliando a aderência de um candidato a uma vaga.
Regras:
- Avalie com base nos dados fornecidos, sem presumir informações não mencionadas.
- "matchScore" é um inteiro de 0 a 100 representando o quão aderente o candidato está à vaga.
- "strengths" lista pontos fortes objetivos do candidato em relação à vaga (skills/experiência que atendem aos requisitos).
- "missingSkills" lista competências exigidas pela vaga que não aparecem no perfil do candidato.
- "recommendation" é uma frase curta e direta (ex.: "Avançar para entrevista técnica", "Não aderente no momento").
- "reasoning" é uma justificativa objetiva de 2-4 frases.
- Responda APENAS com JSON válido neste formato exato:
{
  "matchScore": 0,
  "strengths": [],
  "missingSkills": [],
  "recommendation": "",
  "reasoning": ""
}`;

  const user = `Vaga:
Título: ${vacancy.title}
Senioridade: ${vacancy.seniority ?? "não informada"}
Descrição: ${vacancy.description ?? "não informada"}
Competências exigidas: ${vacancy.requiredSkills.join(", ") || "nenhuma listada"}

Candidato:
Nome: ${candidate.name}
Senioridade: ${candidate.seniority ?? "não informada"}
Competências: ${candidate.skills.join(", ") || "nenhuma listada"}
Resumo de experiência: ${candidate.experienceSummary ?? "não informado"}

Avalie a aderência e retorne o JSON no formato definido.`;

  return { system, user };
}
