import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
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
import { buildResumeExtractionPrompt } from "../prompts/resume-extraction.prompt";
import { buildMatchPrompt } from "../prompts/match.prompt";

/** Provider real, usando a API da OpenAI (chave via OPENAI_API_KEY). */
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async extractResumeData(resumeText: string): Promise<ParsedResume> {
    const { system, user } = buildResumeExtractionPrompt(resumeText);
    const json = await this.completeJson(system, user);
    return {
      name: json.name ?? "",
      email: json.email || undefined,
      phone: json.phone || undefined,
      location: json.location || undefined,
      skills: Array.isArray(json.skills) ? json.skills : [],
      experience: Array.isArray(json.experience) ? json.experience : [],
      education: Array.isArray(json.education) ? json.education : [],
      seniority: json.seniority || undefined,
      languages: Array.isArray(json.languages) ? json.languages : [],
      linkedin: json.linkedin || undefined,
      portfolio: json.portfolio || undefined,
    };
  }

  async matchCandidateToVacancy(vacancy: MatchInputVacancy, candidate: MatchInputCandidate): Promise<MatchResult> {
    const { system, user } = buildMatchPrompt(vacancy, candidate);
    const json = await this.completeJson(system, user);
    return {
      matchScore: Math.max(0, Math.min(100, Math.round(Number(json.matchScore) || 0))),
      strengths: Array.isArray(json.strengths) ? json.strengths : [],
      missingSkills: Array.isArray(json.missingSkills) ? json.missingSkills : [],
      recommendation: json.recommendation ?? "",
      reasoning: json.reasoning ?? "",
    };
  }

  /**
   * Previsão de time-to-fill é puramente estatística/heurística (senioridade,
   * nº de competências, velocidade do pipeline) — não se beneficia de uma
   * chamada a LLM, então usamos a mesma lógica determinística do provider
   * mock também aqui, evitando latência/custo desnecessários.
   */
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
    return { estimatedDays: days, confidence, reasoning, benchmarkDays: 28 };
  }

  async generateInsights(snapshot: InsightSnapshot): Promise<GeneratedInsight[]> {
    const system =
      "Você é um HR Manager sênior analisando os dados operacionais de uma empresa (vagas, candidaturas, onboardings, pipeline de consultoria, colaboradores). " +
      'Gere até 6 insights acionáveis e específicos, cada um com "type" (problem | opportunity | suggestion), "text" (1-2 frases, em português) e "area" (ex.: Recruitment, Onboarding, Consulting, People, Talent Pool). ' +
      'Responda em JSON: { "insights": [{ "type": "...", "text": "...", "area": "..." }] }.';
    const user = JSON.stringify(snapshot);
    const json = await this.completeJson(system, user);
    const insights = Array.isArray(json.insights) ? json.insights : [];
    return insights
      .filter((i: any) => i && i.text)
      .slice(0, 6)
      .map((i: any) => ({ type: i.type ?? "suggestion", text: i.text, area: i.area }));
  }

  async qualifyConsultingLead(lead: ConsultingLeadInput): Promise<ConsultingQualification> {
    const system =
      'Você avalia leads de um pipeline de consultoria de RH. Dado o lead, retorne JSON: { "priority": "Alta"|"Média"|"Baixa", "reasoning": "...", "suggestedNextStep": "..." } em português, conciso.';
    const user = JSON.stringify(lead);
    const json = await this.completeJson(system, user);
    return {
      priority: json.priority === "Alta" || json.priority === "Baixa" ? json.priority : "Média",
      reasoning: json.reasoning ?? "",
      suggestedNextStep: json.suggestedNextStep ?? "",
    };
  }

  /**
   * Sugestão de checklist também é majoritariamente template + pequenas
   * variações por cargo — mantemos heurístico para evitar depender de uma
   * chamada de rede para algo estruturalmente simples.
   */
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
    return checklist;
  }

  private async completeJson(system: string, user: string): Promise<Record<string, any>> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const content = completion.choices[0]?.message?.content ?? "{}";
      return JSON.parse(content);
    } catch (error) {
      this.logger.error("Falha ao chamar a OpenAI", error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}
