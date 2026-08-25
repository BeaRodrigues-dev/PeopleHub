"use strict";
/**
 * Mesma lógica do MockAiProvider do backend real
 * (backend/src/modules/ai/providers/mock-ai.provider.ts) — heurísticas
 * determinísticas, sem chamar nenhum serviço externo. Ativado sempre aqui
 * (este servidor mock não tenta usar OPENAI_API_KEY).
 */
const KNOWN_SKILLS = [
  "React", "Angular", "Vue", "TypeScript", "JavaScript", "Node.js", "NestJS", "Express",
  "Python", "Django", "Flask", "Java", "Spring", "Kotlin", "Swift", "Go", "Rust", "C#", ".NET",
  "PHP", "Laravel", "Ruby", "Rails", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Terraform", "GraphQL", "REST",
  "Figma", "Design System", "UX Research", "Prototipação", "Excel", "Power BI", "SQL Server",
  "Scrum", "Kanban", "Liderança", "Gestão de Projetos", "Negociação", "CRM", "SEO", "Google Ads",
];
const SENIORITY_KEYWORDS = [
  [/especialista|staff|principal/i, "Especialista"],
  [/s[eê]nior|senior/i, "Sênior"],
  [/pleno|mid-level/i, "Pleno"],
  [/j[uú]nior|junior|trainee|est[aá]gio/i, "Júnior"],
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractResumeData(resumeText) {
  const text = resumeText.replace(/\s+/g, " ").trim();
  const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean);

  const email = (text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i) || [])[0];
  const phone = (text.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/) || [])[0];
  const linkedin = (text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[a-z0-9\-_/]+/i) || [])[0];
  const portfolio = (text.match(/(https?:\/\/)?(www\.)?(github\.com|behance\.net|dribbble\.com)\/[a-z0-9\-_/]+/i) || [])[0];
  const name = (lines[0] || "Candidato sem nome identificado").slice(0, 80);

  const skills = KNOWN_SKILLS.filter((skill) => new RegExp(`\\b${escapeRegex(skill)}\\b`, "i").test(text));
  const seniority = (SENIORITY_KEYWORDS.find(([re]) => re.test(text)) || [null, "Pleno"])[1];
  const languages = ["Inglês", "Espanhol", "Português"].filter((lang) => new RegExp(lang, "i").test(text));

  return {
    name,
    email,
    phone,
    location: undefined,
    skills,
    experience: [],
    education: [],
    seniority,
    languages,
    linkedin,
    portfolio,
  };
}

function matchCandidateToVacancy(vacancy, candidate) {
  const candidateSkills = new Set((candidate.skills || []).map((s) => s.toLowerCase().trim()));
  const required = vacancy.requiredSkills || [];
  const strengths = required.filter((skill) => candidateSkills.has(skill.toLowerCase().trim()));
  const missingSkills = required.filter((skill) => !candidateSkills.has(skill.toLowerCase().trim()));
  const matchScore = required.length ? Math.round((strengths.length / required.length) * 100) : 0;
  const recommendation = matchScore >= 70 ? "Avançar para entrevista" : matchScore >= 40 ? "Avaliar com o time técnico" : "Baixa aderência no momento";
  const reasoning = `Aderência calculada por sobreposição de competências: ${strengths.length} de ${required.length} competências exigidas foram encontradas no perfil do candidato.`;
  return { matchScore, strengths, missingSkills, recommendation, reasoning };
}

/**
 * Previsão heurística de "time to fill" (dias até preencher a vaga), baseada
 * em senioridade, nº de competências exigidas, modelo de trabalho e no
 * andamento real do pipeline (candidaturas ativas / etapas avançadas).
 */
function predictTimeToFill(vacancy, applications) {
  const SENIORITY_BASE = { "Estágio": 16, "Júnior": 20, "Pleno": 26, "Sênior": 33, "Especialista": 40 };
  let days = SENIORITY_BASE[vacancy.seniority] ?? 26;

  const skillCount = (vacancy.requiredSkills || []).length;
  if (skillCount > 3) days += (skillCount - 3) * 1.5;
  if (vacancy.workModel === "Remoto") days -= 3;
  if (vacancy.workModel === "Presencial") days += 4;

  const active = (applications || []).filter((a) => a.status === "ACTIVE");
  days -= Math.min(8, active.length * 0.8);
  const advancedStages = active.filter((a) => ["Oferta", "Entrevista Técnica", "Entrevista RH", "Contratado"].includes(a.currentStage));
  days -= advancedStages.length * 2;

  days = Math.max(7, Math.round(days));
  const confidence = active.length >= 5 ? "Alta" : active.length >= 2 ? "Média" : "Baixa";
  const reasoning = `Estimativa baseada em senioridade (${vacancy.seniority || "não definida"}), ${skillCount} competência(s) exigida(s), modelo de trabalho ${vacancy.workModel || "não definido"} e ${active.length} candidatura(s) ativa(s) no pipeline${advancedStages.length ? ` (${advancedStages.length} já em etapas avançadas)` : ""}.`;

  return { estimatedDays: days, confidence, reasoning, benchmarkDays: 28 };
}

/**
 * Lê um snapshot dos dados do sistema (vagas, candidaturas, onboardings,
 * pipeline de consulting) e sugere insights automáticos — o mesmo tipo de
 * observação que um HR Manager faria ao revisar os dashboards.
 */
function generateInsights({ vacancies = [], applications = [], candidates = [], onboardings = [], consultingLeads = [], employees = [] } = {}) {
  const insights = [];
  const dayMs = 86_400_000;
  const nowTs = Date.now();

  for (const vacancy of vacancies) {
    if (vacancy.status !== "Aberta") continue;
    const vacancyApps = applications.filter((a) => a.vacancyId === vacancy.id);
    const active = vacancyApps.filter((a) => a.status === "ACTIVE");
    const daysOpen = Math.round((nowTs - new Date(vacancy.createdAt).getTime()) / dayMs);

    if (active.length === 0 && daysOpen > 10) {
      insights.push({ type: "problem", text: `A vaga "${vacancy.title}" está aberta há ${daysOpen} dias sem candidaturas ativas — vale revisar a estratégia de sourcing.`, area: "Recruitment" });
    } else {
      const prediction = predictTimeToFill(vacancy, vacancyApps);
      if (prediction.estimatedDays > prediction.benchmarkDays + 5) {
        insights.push({ type: "problem", text: `Previsão de preenchimento da vaga "${vacancy.title}" é de ${prediction.estimatedDays} dias, acima da média da empresa (${prediction.benchmarkDays}d) — considerar ajustar requisitos ou canais de sourcing.`, area: "Recruitment" });
      }
    }
  }

  for (const onboarding of onboardings) {
    const daysSinceStart = Math.round((nowTs - new Date(onboarding.startDate).getTime()) / dayMs);
    if (daysSinceStart >= 5 && onboarding.progress < 60) {
      insights.push({ type: "problem", text: `Onboarding de ${onboarding.employeeName} está ${onboarding.progress}% completo, ${daysSinceStart} dias após a entrada — checklist parece atrasado.`, area: "Onboarding" });
    }
  }

  for (const lead of consultingLeads) {
    const daysSinceCreated = Math.round((nowTs - new Date(lead.createdAt).getTime()) / dayMs);
    if ((lead.status === "Reunião agendada" || lead.status === "Em negociação") ) {
      insights.push({ type: "opportunity", text: `${lead.company} está em "${lead.status}" (necessidade: ${lead.need}) — oportunidade de negócio ativa, dar seguimento.`, area: "Consulting" });
    } else if (lead.status === "Pesquisado" && daysSinceCreated > 10) {
      insights.push({ type: "suggestion", text: `${lead.company} está pesquisada há ${daysSinceCreated} dias sem contacto — agendar primeira abordagem.`, area: "Consulting" });
    }
  }

  const poolCandidates = candidates.filter((c) => !c.vacancyId);
  const openVacancies = vacancies.filter((v) => v.status === "Aberta");
  for (const vacancy of openVacancies) {
    const required = (vacancy.requiredSkills || []).map((s) => s.toLowerCase().trim());
    if (!required.length) continue;
    const strongMatches = poolCandidates.filter((c) => {
      const skills = new Set((c.skills || []).map((s) => s.toLowerCase().trim()));
      const overlap = required.filter((s) => skills.has(s)).length;
      return required.length > 0 && overlap / required.length >= 0.6;
    });
    if (strongMatches.length >= 2) {
      insights.push({ type: "opportunity", text: `${strongMatches.length} talentos no Banco de Talentos têm forte aderência à vaga "${vacancy.title}" — considerar convite direto antes de abrir novo sourcing.`, area: "Talent Pool" });
    }
  }

  const offboarding = employees.filter((e) => e.lifecycle === "Offboarding" || e.status === "Offboarding");
  if (offboarding.length) {
    insights.push({ type: "suggestion", text: `${offboarding.length} colaborador(es) em offboarding (${offboarding.map((e) => e.name).join(", ")}) — planear transição de conhecimento e exit interview.`, area: "People" });
  }

  // dedupe por texto e limita a um número razoável de sugestões por geração
  const seen = new Set();
  const unique = insights.filter((i) => (seen.has(i.text) ? false : (seen.add(i.text), true)));
  return unique.slice(0, 6);
}

/**
 * Qualificação heurística de um lead de consulting: prioridade + próximo
 * passo sugerido, com base no status atual, dimensão da empresa e valor.
 */
function qualifyConsultingLead(lead) {
  const valueNumber = Number((lead.value || "").replace(/[^\d]/g, "")) || 0;
  const isLargeCompany = /100\+/.test(lead.size || "");
  let priority = "Média";
  if (lead.status === "Reunião agendada" || lead.status === "Em negociação" || valueNumber >= 3000 || isLargeCompany) priority = "Alta";
  if (lead.status === "Pesquisado" && valueNumber === 0 && !isLargeCompany) priority = "Baixa";

  const NEXT_STEP = {
    "Pesquisado": "Agendar primeiro contacto de apresentação",
    "Proposta enviada": "Fazer follow-up da proposta em 3–5 dias úteis",
    "Reunião agendada": "Preparar deck personalizado para a reunião",
    "Em negociação": "Alinhar termos finais e enviar contrato",
    "Cliente": "Agendar check-in trimestral de satisfação",
  };

  const reasoning = `${lead.company} (${lead.sector}, ${lead.size} colaboradores) está em "${lead.status}" com necessidade de ${lead.need}${valueNumber ? ` e valor estimado de ${lead.value}` : ""}.`;

  return {
    priority,
    reasoning,
    suggestedNextStep: NEXT_STEP[lead.status] || "Definir próximo passo com o time de Business Dev",
    evaluatedAt: new Date().toISOString(),
  };
}

const BASE_ONBOARDING_CHECKLIST = {
  before: ["Contrato assinado", "Acessos criados (email, Slack, ferramentas)", "Equipamento preparado", "Welcome email enviado"],
  day1: ["Welcome meeting com HR", "Apresentação à equipa", "Tour cultura & valores", "Setup ferramentas"],
  week1: ["Follow-up 1:1 com manager", "Feedback do novo colaborador", "30-day plan alinhado"],
};

const ROLE_EXTRA_ITEMS = [
  { match: /engenh|developer|dev\b|frontend|backend|software/i, phase: "day1", label: "Setup do ambiente de desenvolvimento e acessos a repositórios" },
  { match: /sales|vendas|conta/i, phase: "day1", label: "Acesso ao CRM e treino no processo comercial" },
  { match: /market/i, phase: "week1", label: "Apresentação do calendário editorial e ferramentas de marketing" },
  { match: /design|product/i, phase: "day1", label: "Acesso ao Figma e biblioteca de design system" },
  { match: /people|rh|hr/i, phase: "week1", label: "Revisão das políticas internas de People & HR" },
];

/** Sugere um checklist de onboarding personalizado a partir do cargo. */
function suggestOnboardingChecklist(role) {
  const checklist = {
    before: BASE_ONBOARDING_CHECKLIST.before.map((label) => ({ label, done: false })),
    day1: BASE_ONBOARDING_CHECKLIST.day1.map((label) => ({ label, done: false })),
    week1: BASE_ONBOARDING_CHECKLIST.week1.map((label) => ({ label, done: false })),
  };
  for (const extra of ROLE_EXTRA_ITEMS) {
    if (extra.match.test(role || "")) {
      checklist[extra.phase].push({ label: extra.label, done: false });
    }
  }
  return checklist;
}

module.exports = {
  extractResumeData,
  matchCandidateToVacancy,
  predictTimeToFill,
  generateInsights,
  qualifyConsultingLead,
  suggestOnboardingChecklist,
};
