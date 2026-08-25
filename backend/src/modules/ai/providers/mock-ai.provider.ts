import { Injectable, Logger } from "@nestjs/common";
import type {
  AiProvider,
  ConsultingLeadInput,
  ConsultingQualification,
  GeneratedInsight,
  InsightSnapshot,
  MatchInputCandidate,
  MatchInputVacancy,
  MatchResult,
  OnboardingChecklistSuggestion,
  ParsedResume,
  TimeToFillInputApplication,
  TimeToFillInputVacancy,
  TimeToFillPrediction,
} from "../interfaces/ai-provider.interface";

const KNOWN_SKILLS = [
  "React", "Angular", "Vue", "TypeScript", "JavaScript", "Node.js", "NestJS", "Express",
  "Python", "Django", "Flask", "Java", "Spring", "Kotlin", "Swift", "Go", "Rust", "C#", ".NET",
  "PHP", "Laravel", "Ruby", "Rails", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Terraform", "GraphQL", "REST",
  "Figma", "Design System", "UX Research", "Prototipação", "Excel", "Power BI", "SQL Server",
  "Scrum", "Kanban", "Liderança", "Gestão de Projetos", "Negociação", "CRM", "SEO", "Google Ads",
];

const SENIORITY_KEYWORDS: Array<[RegExp, string]> = [
  [/especialista|staff|principal/i, "Especialista"],
  [/s[eê]nior|senior/i, "Sênior"],
  [/pleno|mid-level/i, "Pleno"],
  [/j[uú]nior|junior|trainee|est[aá]gio/i, "Júnior"],
];

/**
 * Provider mock, usado automaticamente quando OPENAI_API_KEY não está
 * configurada. Não chama nenhum serviço externo — usa heurísticas
 * determinísticas (regex + dicionário de skills), suficiente para
 * desenvolver e demonstrar o fluxo fim a fim sem custo/latência de IA real.
 */
@Injectable()
export class MockAiProvider implements AiProvider {
  readonly name = "mock";
  private readonly logger = new Logger(MockAiProvider.name);

  constructor() {
    this.logger.warn(
      "OPENAI_API_KEY não configurada — usando MockAiProvider (heurístico, sem chamadas externas). " +
        "Defina OPENAI_API_KEY no .env para usar a IA real.",
    );
  }

  async extractResumeData(resumeText: string): Promise<ParsedResume> {
    const text = resumeText.replace(/\s+/g, " ").trim();
    const lines = resumeText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const email = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
    const phone = text.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/)?.[0];
    const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[a-z0-9\-_/]+/i)?.[0];
    const portfolio = text.match(/(https?:\/\/)?(www\.)?(github\.com|behance\.net|dribbble\.com)\/[a-z0-9\-_/]+/i)?.[0];
    const name = lines[0]?.slice(0, 80) ?? "Candidato sem nome identificado";

    const skills = KNOWN_SKILLS.filter((skill) => new RegExp(`\\b${escapeRegex(skill)}\\b`, "i").test(text));
    const seniority = SENIORITY_KEYWORDS.find(([regex]) => regex.test(text))?.[1] ?? "Pleno";
    const languages = ["Inglês", "Espanhol", "Português"].filter((lang) => new RegExp(lang, "i").test(text));

    await simulateLatency();
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

  async matchCandidateToVacancy(vacancy: MatchInputVacancy, candidate: MatchInputCandidate): Promise<MatchResult> {
    const candidateSkills = new Set(candidate.skills.map((s) => s.toLowerCase().trim()));
    const strengths = vacancy.requiredSkills.filter((skill) => candidateSkills.has(skill.toLowerCase().trim()));
    const missingSkills = vacancy.requiredSkills.filter((skill) => !candidateSkills.has(skill.toLowerCase().trim()));
    const matchScore = vacancy.requiredSkills.length
      ? Math.round((strengths.length / vacancy.requiredSkills.length) * 100)
      : 0;

    const recommendation =
      matchScore >= 70 ? "Avançar para entrevista" : matchScore >= 40 ? "Avaliar com o time técnico" : "Baixa aderência no momento";
    const reasoning = `Aderência calculada por sobreposição de competências: ${strengths.length} de ${vacancy.requiredSkills.length} competências exigidas foram encontradas no perfil do candidato.`;

    await simulateLatency();
    return { matchScore, strengths, missingSkills, recommendation, reasoning };
  }

  async predictTimeToFill(vacancy: TimeToFillInputVacancy, applications: TimeToFillInputApplication[]): Promise<TimeToFillPrediction> {
    const SENIORITY_BASE: Record<string, number> = { "Estágio": 16, "Júnior": 20, "Pleno": 26, "Sênior": 33, "Especialista": 40 };
    let days = SENIORITY_BASE[vacancy.seniority ?? ""] ?? 26;

    const skillCount = vacancy.requiredSkills.length;
    if (skillCount > 3) days += (skillCount - 3) * 1.5;
    if (vacancy.workModel === "Remoto") days -= 3;
    if (vacancy.workModel === "Presencial") days += 4;

    const active = applications.filter((a) => a.status === "ACTIVE");
    days -= Math.min(8, active.length * 0.8);
    const advancedStages = active.filter((a) => ["Oferta", "Entrevista Técnica", "Entrevista RH", "Contratado"].includes(a.currentStage));
    days -= advancedStages.length * 2;

    days = Math.max(7, Math.round(days));
    const confidence: TimeToFillPrediction["confidence"] = active.length >= 5 ? "Alta" : active.length >= 2 ? "Média" : "Baixa";
    const reasoning = `Estimativa baseada em senioridade (${vacancy.seniority || "não definida"}), ${skillCount} competência(s) exigida(s), modelo de trabalho ${vacancy.workModel || "não definido"} e ${active.length} candidatura(s) ativa(s) no pipeline${advancedStages.length ? ` (${advancedStages.length} já em etapas avançadas)` : ""}.`;

    await simulateLatency();
    return { estimatedDays: days, confidence, reasoning, benchmarkDays: 28 };
  }

  async generateInsights(snapshot: InsightSnapshot): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];
    const dayMs = 86_400_000;
    const nowTs = Date.now();

    for (const vacancy of snapshot.vacancies) {
      if (vacancy.status !== "Aberta") continue;
      const vacancyApps = snapshot.applications.filter((a) => a.vacancyId === vacancy.id);
      const active = vacancyApps.filter((a) => a.status === "ACTIVE");
      const daysOpen = Math.round((nowTs - new Date(vacancy.createdAt).getTime()) / dayMs);
      if (active.length === 0 && daysOpen > 10) {
        insights.push({ type: "problem", text: `A vaga "${vacancy.title}" está aberta há ${daysOpen} dias sem candidaturas ativas — vale revisar a estratégia de sourcing.`, area: "Recruitment" });
      } else {
        const prediction = await this.predictTimeToFill(vacancy, vacancyApps);
        if (prediction.estimatedDays > prediction.benchmarkDays + 5) {
          insights.push({ type: "problem", text: `Previsão de preenchimento da vaga "${vacancy.title}" é de ${prediction.estimatedDays} dias, acima da média da empresa (${prediction.benchmarkDays}d) — considerar ajustar requisitos ou canais de sourcing.`, area: "Recruitment" });
        }
      }
    }

    for (const onboarding of snapshot.onboardings) {
      const daysSinceStart = Math.round((nowTs - new Date(onboarding.startDate).getTime()) / dayMs);
      if (daysSinceStart >= 5 && onboarding.progress < 60) {
        insights.push({ type: "problem", text: `Onboarding de ${onboarding.employeeName} está ${onboarding.progress}% completo, ${daysSinceStart} dias após a entrada — checklist parece atrasado.`, area: "Onboarding" });
      }
    }

    for (const lead of snapshot.consultingLeads) {
      const daysSinceCreated = Math.round((nowTs - new Date(lead.createdAt).getTime()) / dayMs);
      if (lead.status === "Reunião agendada" || lead.status === "Em negociação") {
        insights.push({ type: "opportunity", text: `${lead.company} está em "${lead.status}" (necessidade: ${lead.need}) — oportunidade de negócio ativa, dar seguimento.`, area: "Consulting" });
      } else if (lead.status === "Pesquisado" && daysSinceCreated > 10) {
        insights.push({ type: "suggestion", text: `${lead.company} está pesquisada há ${daysSinceCreated} dias sem contacto — agendar primeira abordagem.`, area: "Consulting" });
      }
    }

    const poolCandidates = snapshot.candidates.filter((c) => !c.vacancyId);
    for (const vacancy of snapshot.vacancies.filter((v) => v.status === "Aberta")) {
      const required = vacancy.requiredSkills.map((s) => s.toLowerCase().trim());
      if (!required.length) continue;
      const strongMatches = poolCandidates.filter((c) => {
        const skills = new Set(c.skills.map((s) => s.toLowerCase().trim()));
        const overlap = required.filter((s) => skills.has(s)).length;
        return overlap / required.length >= 0.6;
      });
      if (strongMatches.length >= 2) {
        insights.push({ type: "opportunity", text: `${strongMatches.length} talentos no Banco de Talentos têm forte aderência à vaga "${vacancy.title}" — considerar convite direto antes de abrir novo sourcing.`, area: "Talent Pool" });
      }
    }

    const offboarding = snapshot.employees.filter((e) => e.lifecycle === "Offboarding" || e.status === "Offboarding");
    if (offboarding.length) {
      insights.push({ type: "suggestion", text: `${offboarding.length} colaborador(es) em offboarding (${offboarding.map((e) => e.name).join(", ")}) — planear transição de conhecimento e exit interview.`, area: "People" });
    }

    const seen = new Set<string>();
    const unique = insights.filter((i) => (seen.has(i.text) ? false : (seen.add(i.text), true)));
    await simulateLatency();
    return unique.slice(0, 6);
  }

  async qualifyConsultingLead(lead: ConsultingLeadInput): Promise<ConsultingQualification> {
    const valueNumber = Number((lead.value || "").replace(/[^\d]/g, "")) || 0;
    const isLargeCompany = /100\+/.test(lead.size || "");
    let priority: ConsultingQualification["priority"] = "Média";
    if (lead.status === "Reunião agendada" || lead.status === "Em negociação" || valueNumber >= 3000 || isLargeCompany) priority = "Alta";
    if (lead.status === "Pesquisado" && valueNumber === 0 && !isLargeCompany) priority = "Baixa";

    const NEXT_STEP: Record<string, string> = {
      "Pesquisado": "Agendar primeiro contacto de apresentação",
      "Proposta enviada": "Fazer follow-up da proposta em 3–5 dias úteis",
      "Reunião agendada": "Preparar deck personalizado para a reunião",
      "Em negociação": "Alinhar termos finais e enviar contrato",
      "Cliente": "Agendar check-in trimestral de satisfação",
    };

    const reasoning = `${lead.company} (${lead.sector}, ${lead.size} colaboradores) está em "${lead.status}" com necessidade de ${lead.need}${valueNumber ? ` e valor estimado de ${lead.value}` : ""}.`;

    await simulateLatency();
    return { priority, reasoning, suggestedNextStep: NEXT_STEP[lead.status] || "Definir próximo passo com o time de Business Dev" };
  }

  async suggestOnboardingChecklist(role: string): Promise<OnboardingChecklistSuggestion> {
    const BASE = {
      before: ["Contrato assinado", "Acessos criados (email, Slack, ferramentas)", "Equipamento preparado", "Welcome email enviado"],
      day1: ["Welcome meeting com HR", "Apresentação à equipa", "Tour cultura & valores", "Setup ferramentas"],
      week1: ["Follow-up 1:1 com manager", "Feedback do novo colaborador", "30-day plan alinhado"],
    };
    const EXTRA: Array<{ match: RegExp; phase: keyof typeof BASE; label: string }> = [
      { match: /engenh|developer|dev\b|frontend|backend|software/i, phase: "day1", label: "Setup do ambiente de desenvolvimento e acessos a repositórios" },
      { match: /sales|vendas|conta/i, phase: "day1", label: "Acesso ao CRM e treino no processo comercial" },
      { match: /market/i, phase: "week1", label: "Apresentação do calendário editorial e ferramentas de marketing" },
      { match: /design|product/i, phase: "day1", label: "Acesso ao Figma e biblioteca de design system" },
      { match: /people|rh|hr/i, phase: "week1", label: "Revisão das políticas internas de People & HR" },
    ];
    const checklist: OnboardingChecklistSuggestion = {
      before: BASE.before.map((label) => ({ label, done: false })),
      day1: BASE.day1.map((label) => ({ label, done: false })),
      week1: BASE.week1.map((label) => ({ label, done: false })),
    };
    for (const extra of EXTRA) {
      if (extra.match.test(role || "")) checklist[extra.phase].push({ label: extra.label, done: false });
    }
    await simulateLatency();
    return checklist;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 150));
}
