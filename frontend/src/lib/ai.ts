/**
 * Heurísticas de "IA" de People Hub — funciones puras que corren en el
 * navegador (client-side), ya que la app no depende de un servidor propio
 * (Supabase se encarga de los datos; estas funciones no llaman a ningún
 * servicio externo).
 */
import type { Vacancy } from "../features/vacancy/types";
import type { Candidate, EducationEntry, ExperienceEntry, ParsedResume } from "../features/candidate/types";
import type { ConsultingLead } from "../features/consulting/types";
import type { Employee } from "../features/people/types";
import type { OnboardingChecklist, OnboardingEntry } from "../features/onboarding/types";
import type { Insight, InsightType } from "../features/insights/types";
import type { ClimateSurveyResult, ClimateSurveyRound } from "../features/climate/types";
import { isExitStage } from "../features/vacancy/types";

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

/**
 * Predicción de tiempo para cubrir la vacante — basada en los números que
 * People carga a mano por etapa (`vacancy.stages[].count`), no en candidatos
 * reales insertados en esta app (que puede no ser el ATS de verdad de quien
 * la usa).
 */
export function predictTimeToFill(vacancy: Vacancy): TimeToFillPrediction {
  let days = SENIORITY_BASE[vacancy.seniority ?? ""] ?? 26;

  const skillCount = (vacancy.requiredSkills || []).length;
  if (skillCount > 3) days += (skillCount - 3) * 1.5;
  if (vacancy.workModel === "Remoto") days -= 3;
  if (vacancy.workModel === "Presencial") days += 4;

  const stages = vacancy.stages ?? [];
  const totalInProcess = stages.reduce((sum, s) => sum + (s.count ?? 0), 0);
  const halfway = stages.length / 2;
  const advanced = stages.filter((s) => !isExitStage(s) && s.order >= halfway).reduce((sum, s) => sum + (s.count ?? 0), 0);

  days -= Math.min(8, totalInProcess * 0.8);
  days -= advanced * 2;

  if (vacancy.daysToFirstOffer !== null && vacancy.daysToFirstOffer !== undefined) {
    days = Math.round((days + vacancy.daysToFirstOffer) / 2);
  }

  days = Math.max(7, Math.round(days));
  const confidence: TimeToFillPrediction["confidence"] = totalInProcess >= 5 ? "Alta" : totalInProcess >= 2 ? "Media" : "Baja";
  const reasoning = `Estimación basada en el nivel de experiencia (${vacancy.seniority || "no definido"}), ${skillCount} competencia(s) exigida(s), modalidad de trabajo ${vacancy.workModel || "no definida"} y ${totalInProcess} persona(s) cargada(s) manualmente en el pipeline${advanced ? ` (${advanced} en etapas avanzadas)` : ""}.`;

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
  candidates?: Candidate[];
  onboardings?: OnboardingEntry[];
  consultingLeads?: ConsultingLead[];
  employees?: Employee[];
}): GeneratedInsight[] {
  const { vacancies = [], candidates = [], onboardings = [], consultingLeads = [], employees = [] } = input;
  const insights: GeneratedInsight[] = [];
  const dayMs = 86_400_000;
  const nowTs = Date.now();

  for (const vacancy of vacancies) {
    if (vacancy.status !== "Abierta") continue;
    const totalInProcess = (vacancy.stages ?? []).reduce((sum, s) => sum + (s.count ?? 0), 0);
    const daysOpen = Math.round((nowTs - new Date(vacancy.createdAt).getTime()) / dayMs);

    if (totalInProcess === 0 && daysOpen > 10) {
      insights.push({ type: "problem", text: `La vacante "${vacancy.title}" lleva ${daysOpen} días abierta sin personas cargadas en el pipeline — vale la pena revisar la estrategia de sourcing.`, area: "Recruitment" });
    } else {
      const prediction = predictTimeToFill(vacancy);
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

// ── copiloto de People Analytics (Encuestas de Clima) ───────────────────────

export interface ClimateThemeSuggestion {
  theme: string;
  score: number;
  insight: string;
  suggestion?: string;
}

export interface ClimateActionSuggestion {
  name: string;
  description: string;
  priority: "Alta" | "Media" | "Baja";
}

export interface ClimateAnalysis {
  summary: string;
  strengths: ClimateThemeSuggestion[];
  opportunities: ClimateThemeSuggestion[];
  actions: ClimateActionSuggestion[];
}

const CLIMATE_STRENGTH_PHRASES: Record<string, string> = {
  "Satisfacción general": "Existe un alto nivel de satisfacción general — los colaboradores se sienten bien en su día a día.",
  "Cultura y pertenencia": "Los colaboradores sienten un fuerte sentido de pertenencia y se identifican con la cultura de la empresa.",
  "Comunicación interna": "La comunicación interna es percibida como clara y transparente.",
  "Liderazgo": "Los líderes son bien evaluados — se percibe cercanía y confianza en la gestión de los equipos.",
  "Desarrollo profesional": "Hay una percepción positiva sobre las oportunidades de desarrollo y crecimiento profesional.",
  "Organización y procesos": "Los procesos internos son percibidos como claros y bien organizados.",
  "Bienestar": "El bienestar de los colaboradores está bien cuidado — se valora el equilibrio entre vida personal y laboral.",
};

const CLIMATE_OPPORTUNITY_PHRASES: Record<string, string> = {
  "Satisfacción general": "La satisfacción general muestra margen de mejora — vale la pena profundizar en las causas con entrevistas cualitativas.",
  "Cultura y pertenencia": "Existe una oportunidad de reforzar el sentido de pertenencia y la identificación con los valores de la empresa.",
  "Comunicación interna": "Existe una oportunidad de aumentar la transparencia sobre decisiones y cambios internos.",
  "Liderazgo": "Se percibe una oportunidad de fortalecer las habilidades de liderazgo y la cercanía de los líderes con sus equipos.",
  "Desarrollo profesional": "Los colaboradores sienten falta de feedback frecuente sobre su desempeño y su crecimiento.",
  "Organización y procesos": "Los procesos internos generan fricción — hay espacio para simplificar y clarificar los flujos de trabajo.",
  "Bienestar": "Existe una oportunidad de reforzar las iniciativas de bienestar y el equilibrio entre vida personal y laboral.",
};

const CLIMATE_ACTION_SUGGESTIONS: Record<string, string> = {
  "Satisfacción general": "Realizar entrevistas 1:1 breves para entender mejor las causas de la insatisfacción.",
  "Cultura y pertenencia": "Organizar encuentros informales y reforzar la comunicación de los valores de la empresa.",
  "Comunicación interna": "Crear un canal de comunicación interna semanal con las novedades de la empresa.",
  "Liderazgo": "Implementar un programa de desarrollo de liderazgo para managers.",
  "Desarrollo profesional": "Crear reuniones 1:1 mensuales entre líderes y colaboradores para dar seguimiento al desarrollo.",
  "Organización y procesos": "Mapear y simplificar, junto con los equipos, los procesos internos más críticos.",
  "Bienestar": "Revisar la carga de trabajo de los equipos y reforzar las rutinas de feedback 1:1.",
};

const CLIMATE_SCORE_MAX_REF = 10;

function climateLevelLabel(avg: number): string {
  if (avg >= 8) return "alto";
  if (avg >= 6) return "moderado";
  return "bajo";
}

/**
 * Analiza los resultados por categoría de una ronda de clima y genera un
 * resumen, fortalezas, oportunidades y sugerencias de acción — 100% heurístico
 * y determinístico (sin llamar a ningún servicio externo), igual que el resto
 * de las funciones de "IA" de la app. Nunca se aplica nada solo: todo queda
 * como sugerencia editable/eliminable para que People decida.
 */
export function analyzeClimateRound(round: Pick<ClimateSurveyRound, "name" | "enps">, results: ClimateSurveyResult[]): ClimateAnalysis {
  if (results.length === 0) {
    return {
      summary: `Todavía no hay puntajes cargados para "${round.name}" — agrega resultados por categoría para generar el análisis.`,
      strengths: [],
      opportunities: [],
      actions: [],
    };
  }

  const average = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const sortedDesc = [...results].sort((a, b) => b.score - a.score);
  const sortedAsc = [...results].sort((a, b) => a.score - b.score);

  const strengthsSource = sortedDesc.filter((r) => r.score >= average);
  const strengths: ClimateThemeSuggestion[] = (strengthsSource.length ? strengthsSource : sortedDesc).slice(0, 3).map((r) => ({
    theme: r.category,
    score: r.score,
    insight: CLIMATE_STRENGTH_PHRASES[r.category] ?? `Los colaboradores valoran especialmente "${r.category}", con un puntaje de ${r.score}/${CLIMATE_SCORE_MAX_REF}.`,
  }));

  const opportunitiesSource = sortedAsc.filter((r) => r.score < average);
  const opportunities: ClimateThemeSuggestion[] = opportunitiesSource.slice(0, 3).map((r) => ({
    theme: r.category,
    score: r.score,
    insight: CLIMATE_OPPORTUNITY_PHRASES[r.category] ?? `"${r.category}" aparece como un área con margen de mejora, con un puntaje de ${r.score}/${CLIMATE_SCORE_MAX_REF}.`,
    suggestion: CLIMATE_ACTION_SUGGESTIONS[r.category] ?? `Crear un plan de escucha activa y seguimiento sobre "${r.category}".`,
  }));

  const actions: ClimateActionSuggestion[] = opportunities.map((o) => ({
    name: o.suggestion ?? `Plan de acción — ${o.theme}`,
    description: o.insight,
    priority: o.score <= average - 1.5 ? "Alta" : "Media",
  }));

  const topStrength = strengths[0];
  const topOpportunity = opportunities[0];
  const enpsText = round.enps !== null && round.enps !== undefined ? `, con un eNPS de ${round.enps > 0 ? "+" : ""}${round.enps}` : "";
  const summary = topOpportunity
    ? `El clima general se ubica en un nivel ${climateLevelLabel(average)} (${average.toFixed(1)}/${CLIMATE_SCORE_MAX_REF}${enpsText}). El aspecto mejor evaluado es "${topStrength.theme}" (${topStrength.score}/${CLIMATE_SCORE_MAX_REF}), mientras que "${topOpportunity.theme}" (${topOpportunity.score}/${CLIMATE_SCORE_MAX_REF}) representa la principal oportunidad de mejora.`
    : `El clima general se ubica en un nivel ${climateLevelLabel(average)} (${average.toFixed(1)}/${CLIMATE_SCORE_MAX_REF}${enpsText}), sin oportunidades críticas identificadas — todas las categorías están parejas y bien evaluadas.`;

  return { summary, strengths, opportunities, actions };
}

export type { Insight };
