export interface ParsedResumeExperience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface ParsedResumeEducation {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: string;
  endYear?: string;
}

export interface ParsedResume {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  skills: string[];
  experience: ParsedResumeExperience[];
  education: ParsedResumeEducation[];
  seniority?: string;
  languages: string[];
  linkedin?: string;
  portfolio?: string;
}

export interface MatchInputVacancy {
  title: string;
  description?: string;
  requiredSkills: string[];
  seniority?: string;
}

export interface MatchInputCandidate {
  name: string;
  skills: string[];
  seniority?: string;
  experienceSummary?: string;
}

export interface MatchResult {
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  recommendation: string;
  reasoning: string;
}

export interface TimeToFillInputVacancy {
  seniority?: string;
  workModel?: string;
  requiredSkills: string[];
}

export interface TimeToFillInputApplication {
  status: string;
  currentStage: string;
}

export interface TimeToFillPrediction {
  estimatedDays: number;
  confidence: "Alta" | "Média" | "Baixa";
  reasoning: string;
  benchmarkDays: number;
}

export interface InsightSnapshot {
  vacancies: Array<{ id: string; title: string; status: string; createdAt: Date | string; requiredSkills: string[]; seniority?: string; workModel?: string }>;
  applications: Array<{ vacancyId: string; status: string; currentStage: string }>;
  candidates: Array<{ vacancyId?: string | null; skills: string[] }>;
  onboardings: Array<{ employeeName: string; startDate: string; progress: number }>;
  consultingLeads: Array<{ company: string; status: string; need: string; createdAt: Date | string }>;
  employees: Array<{ name: string; status: string; lifecycle: string }>;
}

export interface GeneratedInsight {
  type: "problem" | "opportunity" | "suggestion";
  text: string;
  area?: string;
}

export interface ConsultingLeadInput {
  company: string;
  sector?: string;
  size?: string;
  need?: string;
  status: string;
  value?: string;
}

export interface ConsultingQualification {
  priority: "Alta" | "Média" | "Baixa";
  reasoning: string;
  suggestedNextStep: string;
}

export interface OnboardingChecklistItem {
  label: string;
  done: boolean;
}

export interface OnboardingChecklistSuggestion {
  before: OnboardingChecklistItem[];
  day1: OnboardingChecklistItem[];
  week1: OnboardingChecklistItem[];
}

/**
 * Contrato que qualquer provider de IA precisa cumprir. Permite trocar
 * OpenAI por outro provedor (ou o mock local) sem tocar no resto da
 * aplicação — AiService só conhece esta interface.
 */
export interface AiProvider {
  readonly name: string;
  extractResumeData(resumeText: string): Promise<ParsedResume>;
  matchCandidateToVacancy(vacancy: MatchInputVacancy, candidate: MatchInputCandidate): Promise<MatchResult>;
  predictTimeToFill(vacancy: TimeToFillInputVacancy, applications: TimeToFillInputApplication[]): Promise<TimeToFillPrediction>;
  generateInsights(snapshot: InsightSnapshot): Promise<GeneratedInsight[]>;
  qualifyConsultingLead(lead: ConsultingLeadInput): Promise<ConsultingQualification>;
  suggestOnboardingChecklist(role: string): Promise<OnboardingChecklistSuggestion>;
}
