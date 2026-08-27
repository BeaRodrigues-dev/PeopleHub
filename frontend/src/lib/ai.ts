/**
 * Heurísticas de "IA" de People Hub — funciones puras que corren en el
 * navegador (client-side), ya que la app no depende de un servidor propio
 * (Supabase se encarga de los datos; estas funciones no llaman a ningún
 * servicio externo).
 */
import type { Vacancy } from "../features/vacancy/types";
import type { Candidate, EducationEntry, ExperienceEntry, ParsedResume } from "../features/candidate/types";
import type { Application } from "../features/kanban/types";
import type { ConsultingLead } from "../features/consulting/types";
import type { Employee } from "../features/people/types";
import type { OnboardingChecklist, OnboardingEntry } from "../features/onboarding/types";
import type { Insight, InsightType } from "../features/insights/types";

// ── extracción (sintética) de currículum ───────────────────────────────────

const SAMPLE_SKILLS = ["React", "TypeScript", "Node.js", "SQL", "Figma", "Python", "AWS", "Liderazgo", "Scrum"];
const SENIORITY_WORDS = ["Senior", "Semi Senior", "Junior", "Especialista"];

function titleCaseFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  if (!base) return "Candidato";
  return base
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

/**
 * Esta app no lee el contenido binario real del PDF/DOCX — en su lugar,
 * genera un texto de currículum plausible a partir del nombre del archivo,
 * suficiente para probar el flujo completo (subida → extracción → pantalla
 * de confirmación → creación del candidato) de punta a punta.
 */
export function buildSyntheticResumeText(filename: string): string {
  const name = titleCaseFromFilename(filename) || "Candidato Sin Nombre";
  const emailSlug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, ".");
  const seed = filename.length + name.length;
  const skills = Array.from({ length: 4 }, (_, i) => SAMPLE_SKILLS[(seed + i * 3) % SAMPLE_SKILLS.length]);
  const seniority = SENIORITY_WORDS[seed % SENIORITY_WORDS.length];

  return [
    name,
    `${emailSlug}@email.com`,
    `+34 6${String(10000000 + seed).padStart(8, "0")}`,
    "",
    `Profesional ${seniority} con sólida experiencia en ${skills.join(", ")}.`,
    "Experiencia: participación en proyectos de alto impacto, colaborando con equipos multidisciplinarios.",
    `Competencias: ${skills.join(", ")}.`,
    "Formación: Licenciatura en área afín.",
    "Idiomas: Español, Inglés.",
    "linkedin.com/in/" + emailSlug,
  ].join("\n");
}

const KNOWN_SKILLS = [
  "React", "Angular", "Vue", "TypeScript", "JavaScript", "Node.js", "NestJS", "Express",
  "Python", "Django", "Flask", "Java", "Spring", "Kotlin", "Swift", "Go", "Rust", "C#", ".NET",
  "PHP", "Laravel", "Ruby", "Rails", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Terraform", "GraphQL", "REST",
  "Figma", "Design System", "UX Research", "Prototipado", "Excel", "Power BI", "SQL Server",
  "Scrum", "Kanban", "Liderazgo", "Gestión de Proyectos", "Negociación", "CRM", "SEO", "Google Ads",
];

const SENIORITY_KEYWORDS: Array<[RegExp, string]> = [
  [/especialista|staff|principal/i, "Especialista"],
  [/s[eé]nior(?!\s*semi)/i, "Senior"],
  [/semi[\s-]?senior|pleno|mid-level/i, "Semi Senior"],
  [/j[uú]nior|junior|trainee|pr[aá]cticas|becari[oa]/i, "Junior"],
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractResumeData(resumeText: string): ParsedResume {
  const text = resumeText.replace(/\s+/g, " ").trim();
  const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean);

  const email = (text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i) || [])[0];
  const phone = (text.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/) || [])[0];
  const linkedin = (text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[a-z0-9\-_/]+/i) || [])[0];
  const portfolio = (text.match(/(https?:\/\/)?(www\.)?(github\.com|behance\.net|dribbble\.com)\/[a-z0-9\-_/]+/i) || [])[0];
  const name = (lines[0] || "Candidato sin nombre identificado").slice(0, 80);

  const skills = KNOWN_SKILLS.filter((skill) => new RegExp(`\\b${escapeRegex(skill)}\\b`, "i").test(text));
  const seniority = (SENIORITY_KEYWORDS.find(([re]) => re.test(text)) || [null, "Semi Senior"])[1] as string;
  const languages = ["Inglés", "Español", "Portugués"].filter((lang) => new RegExp(lang, "i").test(text));

  const experience: ExperienceEntry[] = [];
  const education: EducationEntry[] = [];

  return { name, email, phone, location: undefined, skills, experience, education, seniority, languages, linkedin, portfolio };
}

// ── match candidato × vacante ────────────────────────────────────────────────

export interface MatchResult {
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  recommendation: string;
  reasoning: string;
}

export function matchCandidateToVacancy(vacancy: Pick<Vacancy, "requiredSkills">, candidate: Pick<Candidate, "skills">): MatchResult {
  const candidateSkills = new Set((candidate.skills || []).map((s) => s.toLowerCase().trim()));
  const required = vacancy.requiredSkills || [];
  const strengths = required.filter((skill) => candidateSkills.has(skill.toLowerCase().trim()));
  const missingSkills = required.filter((skill) => !candidateSkills.has(skill.toLowerCase().trim()));
  const matchScore = required.length ? Math.round((strengths.length / required.length) * 100) : 0;
  const recommendation = matchScore >= 70 ? "Avanzar a entrevista" : matchScore >= 40 ? "Evaluar con el equipo técnico" : "Baja afinidad por el momento";
  const reasoning = `Afinidad calculada por superposición de competencias: se encontraron ${strengths.length} de ${required.length} competencias exigidas en el perfil del candidato.`;
  return { matchScore, strengths, missingSkills, recommendation, reasoning };
}

// ── time-to-fill ────────────────────────────────────────────────────────────

export interface TimeToFillPrediction {
  estimatedDays: number;
  confidence: "Alta" | "Media" | "Baja";
  reasoning: string;
  benchmarkDays: number;
}

const SENIORITY_BASE: Record<string, number> = { "Prácticas": 16, "Junior": 20, "Semi Senior": 26, "Senior": 33, "Especialista": 40 };

export function predictTimeToFill(vacancy: Vacancy, applications: Application[]): TimeToFillPrediction {
  let days = SENIORITY_BASE[vacancy.seniority ?? ""] ?? 26;

  const skillCount = (vacancy.requiredSkills || []).length;
  if (skillCount > 3) days += (skillCount - 3) * 1.5;
  if (vacancy.workModel === "Remoto") days -= 3;
  if (vacancy.workModel === "Presencial") days += 4;

  const active = (applications || []).filter((a) => a.status === "ACTIVE");
  days -= Math.min(8, active.length * 0.8);
  const advancedStages = active.filter((a) => ["Oferta", "Entrevista Técnica", "Entrevista RR. HH.", "Contratado"].includes(a.currentStage));
  days -= advancedStages.length * 2;

  days = Math.max(7, Math.round(days));
  const confidence: TimeToFillPrediction["confidence"] = active.length >= 5 ? "Alta" : active.length >= 2 ? "Media" : "Baja";
  const reasoning = `Estimación basada en el nivel de experiencia (${vacancy.seniority || "no definido"}), ${skillCount} competencia(s) exigida(s), modalidad de trabajo ${vacancy.workModel || "no definida"} y ${active.length} candidatura(s) activa(s) en el pipeline${advancedStages.length ? ` (${advancedStages.length} ya en etapas avanzadas)` : ""}.`;

  return { estimatedDays: days, confidence, reasoning, benchmarkDays: 28 };
}

// ── insights automáticos ────────────────────────────────────────────────────

export interface GeneratedInsight {
  type: InsightType;
  text: string;
  area?: string;
}

export function generateInsights(input: {
  vacancies?: Vacancy[];
  applications?: Application[];
  candidates?: Candidate[];
  onboardings?: OnboardingEntry[];
  consultingLeads?: ConsultingLead[];
  employees?: Employee[];
}): GeneratedInsight[] {
  const { vacancies = [], applications = [], candidates = [], onboardings = [], consultingLeads = [], employees = [] } = input;
  const insights: GeneratedInsight[] = [];
  const dayMs = 86_400_000;
  const nowTs = Date.now();

  for (const vacancy of vacancies) {
    if (vacancy.status !== "Abierta") continue;
    const vacancyApps = applications.filter((a) => a.vacancyId === vacancy.id);
    const active = vacancyApps.filter((a) => a.status === "ACTIVE");
    const daysOpen = Math.round((nowTs - new Date(vacancy.createdAt).getTime()) / dayMs);

    if (active.length === 0 && daysOpen > 10) {
      insights.push({ type: "problem", text: `La vacante "${vacancy.title}" lleva ${daysOpen} días abierta sin candidaturas activas — vale la pena revisar la estrategia de sourcing.`, area: "Recruitment" });
    } else {
      const prediction = predictTimeToFill(vacancy, vacancyApps);
      if (prediction.estimatedDays > prediction.benchmarkDays + 5) {
        insights.push({ type: "problem", text: `La previsión de cobertura de la vacante "${vacancy.title}" es de ${prediction.estimatedDays} días, por encima del promedio de la empresa (${prediction.benchmarkDays}d) — considera ajustar los requisitos o los canales de sourcing.`, area: "Recruitment" });
      }
    }
  }

  for (const onboarding of onboardings) {
    const daysSinceStart = Math.round((nowTs - new Date(onboarding.startDate).getTime()) / dayMs);
    if (daysSinceStart >= 5 && onboarding.progress < 60) {
      insights.push({ type: "problem", text: `El onboarding de ${onboarding.employeeName} está ${onboarding.progress}% completo, ${daysSinceStart} días después del ingreso — el checklist parece atrasado.`, area: "Onboarding" });
    }
  }

  for (const lead of consultingLeads) {
    const daysSinceCreated = Math.round((nowTs - new Date(lead.createdAt).getTime()) / dayMs);
    if (lead.status === "Reunión agendada" || lead.status === "En negociación") {
      insights.push({ type: "opportunity", text: `${lead.company} está en "${lead.status}" (necesidad: ${lead.need}) — oportunidad de negocio activa, dar seguimiento.`, area: "Consulting" });
    } else if (lead.status === "Investigado" && daysSinceCreated > 10) {
      insights.push({ type: "suggestion", text: `${lead.company} lleva ${daysSinceCreated} días investigada sin contacto — agenda un primer acercamiento.`, area: "Consulting" });
    }
  }

  const poolCandidates = candidates.filter((c) => !c.vacancyId);
  const openVacancies = vacancies.filter((v) => v.status === "Abierta");
  for (const vacancy of openVacancies) {
    const required = (vacancy.requiredSkills || []).map((s) => s.toLowerCase().trim());
    if (!required.length) continue;
    const strongMatches = poolCandidates.filter((c) => {
      const skills = new Set((c.skills || []).map((s) => s.toLowerCase().trim()));
      const overlap = required.filter((s) => skills.has(s)).length;
      return required.length > 0 && overlap / required.length >= 0.6;
    });
    if (strongMatches.length >= 2) {
      insights.push({ type: "opportunity", text: `${strongMatches.length} talentos del Banco de Talentos tienen fuerte afinidad con la vacante "${vacancy.title}" — considera una invitación directa antes de abrir un nuevo sourcing.`, area: "Talent Pool" });
    }
  }

  const offboarding = employees.filter((e) => e.lifecycle === "Offboarding" || e.status === "Offboarding");
  if (offboarding.length) {
    insights.push({ type: "suggestion", text: `${offboarding.length} colaborador(es) en offboarding (${offboarding.map((e) => e.name).join(", ")}) — planifica la transición de conocimiento y la entrevista de salida.`, area: "People" });
  }

  const seen = new Set<string>();
  const unique = insights.filter((i) => (seen.has(i.text) ? false : (seen.add(i.text), true)));
  return unique.slice(0, 6);
}

// ── calificación de lead de consultoría ─────────────────────────────────────

export interface LeadQualification {
  priority: "Alta" | "Media" | "Baja";
  reasoning: string;
  suggestedNextStep: string;
  evaluatedAt: string;
}

const NEXT_STEP: Record<string, string> = {
  "Investigado": "Agendar primer contacto de presentación",
  "Propuesta enviada": "Hacer seguimiento de la propuesta en 3–5 días hábiles",
  "Reunión agendada": "Preparar deck personalizado para la reunión",
  "En negociación": "Alinear términos finales y enviar contrato",
  "Cliente": "Agendar check-in trimestral de satisfacción",
};

export function qualifyConsultingLead(lead: ConsultingLead): LeadQualification {
  const valueNumber = Number((lead.value || "").replace(/[^\d]/g, "")) || 0;
  const isLargeCompany = /100\+/.test(lead.size || "");
  let priority: LeadQualification["priority"] = "Media";
  if (lead.status === "Reunión agendada" || lead.status === "En negociación" || valueNumber >= 3000 || isLargeCompany) priority = "Alta";
  if (lead.status === "Investigado" && valueNumber === 0 && !isLargeCompany) priority = "Baja";

  const reasoning = `${lead.company} (${lead.sector}, ${lead.size} colaboradores) está en "${lead.status}" con necesidad de ${lead.need}${valueNumber ? ` y valor estimado de ${lead.value}` : ""}.`;

  return {
    priority,
    reasoning,
    suggestedNextStep: NEXT_STEP[lead.status] || "Definir el próximo paso con el equipo de Business Dev",
    evaluatedAt: new Date().toISOString(),
  };
}

// ── checklist de onboarding sugerido ────────────────────────────────────────

const BASE_ONBOARDING_CHECKLIST = {
  before: ["Contrato firmado", "Accesos creados (correo, Slack, herramientas)", "Equipo preparado", "Correo de bienvenida enviado"],
  day1: ["Reunión de bienvenida con RR. HH.", "Presentación al equipo", "Recorrido por cultura y valores", "Configuración de herramientas"],
  week1: ["Seguimiento 1:1 con el manager", "Feedback del nuevo colaborador", "Plan de 30 días alineado"],
};

const ROLE_EXTRA_ITEMS: Array<{ match: RegExp; phase: keyof OnboardingChecklist; label: string }> = [
  { match: /ingenier|developer|dev\b|frontend|backend|software/i, phase: "day1", label: "Configuración del entorno de desarrollo y accesos a repositorios" },
  { match: /ventas|sales|cuenta/i, phase: "day1", label: "Acceso al CRM y capacitación en el proceso comercial" },
  { match: /market/i, phase: "week1", label: "Presentación del calendario editorial y herramientas de marketing" },
  { match: /diseñ|design|product/i, phase: "day1", label: "Acceso a Figma y a la biblioteca de design system" },
  { match: /people|rrhh|rr\.\s*hh|recursos humanos/i, phase: "week1", label: "Revisión de las políticas internas de People & HR" },
];

/** Sugiere un checklist de onboarding personalizado a partir del cargo. */
export function suggestOnboardingChecklist(role: string): OnboardingChecklist {
  const checklist: OnboardingChecklist = {
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

export function computeProgress(checklist: OnboardingChecklist): number {
  const items = [...checklist.before, ...checklist.day1, ...checklist.week1];
  if (!items.length) return 0;
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

export type { Insight };
