import { Inject, Injectable } from "@nestjs/common";
import { AI_PROVIDER } from "./ai.constants";
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
} from "./interfaces/ai-provider.interface";

/**
 * Fachada única de IA usada pelo resto da aplicação. Não sabe (nem precisa
 * saber) se por trás está a OpenAI de verdade ou o provider mock — apenas
 * delega para o provider injetado (ver ai.module.ts).
 */
@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  get providerName(): string {
    return this.provider.name;
  }

  extractResumeData(resumeText: string): Promise<ParsedResume> {
    return this.provider.extractResumeData(resumeText);
  }

  matchCandidateToVacancy(vacancy: MatchInputVacancy, candidate: MatchInputCandidate): Promise<MatchResult> {
    return this.provider.matchCandidateToVacancy(vacancy, candidate);
  }

  predictTimeToFill(vacancy: TimeToFillInputVacancy, applications: TimeToFillInputApplication[]): Promise<TimeToFillPrediction> {
    return this.provider.predictTimeToFill(vacancy, applications);
  }

  generateInsights(snapshot: InsightSnapshot): Promise<GeneratedInsight[]> {
    return this.provider.generateInsights(snapshot);
  }

  qualifyConsultingLead(lead: ConsultingLeadInput): Promise<ConsultingQualification> {
    return this.provider.qualifyConsultingLead(lead);
  }

  suggestOnboardingChecklist(role: string): Promise<OnboardingChecklistSuggestion> {
    return this.provider.suggestOnboardingChecklist(role);
  }
}
