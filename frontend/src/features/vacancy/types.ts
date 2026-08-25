export const VACANCY_STATUSES = ["Aberta", "Pausada", "Fechada", "Rascunho"] as const;
export type VacancyStatus = (typeof VACANCY_STATUSES)[number];

export const WORK_MODELS = ["Presencial", "Híbrido", "Remoto"] as const;
export type WorkModel = (typeof WORK_MODELS)[number];

export const SENIORITIES = ["Estágio", "Júnior", "Pleno", "Sênior", "Especialista"] as const;

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isTerminal?: boolean;
}

export interface Vacancy {
  id: string;
  title: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  department?: string;
  location?: string;
  workModel: WorkModel;
  seniority?: string;
  status: VacancyStatus;
  requiredSkills: string[];
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export type CreateVacancyInput = Omit<Vacancy, "id" | "createdAt" | "updatedAt" | "stages"> & {
  stages: Array<{ name: string; order: number; isTerminal?: boolean }>;
};

export interface TimeToFillPrediction {
  estimatedDays: number;
  confidence: "Alta" | "Média" | "Baixa";
  reasoning: string;
  benchmarkDays: number;
}
