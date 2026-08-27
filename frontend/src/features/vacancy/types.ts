export const VACANCY_STATUSES = ["Abierta", "Pausada", "Cerrada", "Borrador"] as const;
export type VacancyStatus = (typeof VACANCY_STATUSES)[number];

export const WORK_MODELS = ["Presencial", "Híbrido", "Remoto"] as const;
export type WorkModel = (typeof WORK_MODELS)[number];

export const SENIORITIES = ["Prácticas", "Junior", "Semi Senior", "Senior", "Especialista"] as const;

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
  confidence: "Alta" | "Media" | "Baja";
  reasoning: string;
  benchmarkDays: number;
}
