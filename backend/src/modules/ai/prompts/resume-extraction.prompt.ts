/**
 * Prompt de extração de currículo. Objetivo: transformar texto bruto (PDF/DOCX
 * já extraído) num JSON estruturado e previsível, sem inventar dados que não
 * estejam no texto.
 */
export function buildResumeExtractionPrompt(resumeText: string): { system: string; user: string } {
  const system = `Você é um assistente de recrutamento especializado em extrair informações estruturadas de currículos.
Regras importantes:
- Extraia SOMENTE informações que estejam explicitamente presentes no texto. Nunca invente dados.
- Se um campo não existir no currículo, retorne string vazia ("") ou array vazio ([]), conforme o tipo.
- "seniority" deve ser uma entre: "Estágio", "Júnior", "Pleno", "Sênior", "Especialista" — infira a partir do tempo total de experiência e dos cargos ocupados.
- "skills" deve conter apenas competências técnicas/comportamentais claramente mencionadas (tecnologias, ferramentas, metodologias).
- Datas em "experience"/"education", quando existirem, devem ficar no formato livre encontrado no texto (ex.: "2021", "Jan/2021").
- Responda APENAS com um JSON válido, sem markdown, sem comentários, seguindo exatamente este formato:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "skills": [],
  "experience": [
    { "company": "", "role": "", "startDate": "", "endDate": "", "current": false, "description": "" }
  ],
  "education": [
    { "institution": "", "degree": "", "fieldOfStudy": "", "startYear": "", "endYear": "" }
  ],
  "seniority": "",
  "languages": [],
  "linkedin": "",
  "portfolio": ""
}`;

  const user = `Texto extraído do currículo:\n"""\n${resumeText.slice(0, 12000)}\n"""\n\nRetorne o JSON estruturado seguindo exatamente o formato definido.`;

  return { system, user };
}
