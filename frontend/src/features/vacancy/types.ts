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
  /** Cuántas personas hay hoy en esta etapa — cargado a mano (no se cuentan candidatos reales). */
  count?: number;
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
  openingDate: string;
  closedAt?: string | null;
  /** Total de candidatos recibidos para esta vaga — cargado a mano. */
  candidatesReceived: number;
  daysToFirstInterview: number | null;
  daysToFirstOffer: number | null;
  /** % de contratados de esta vaga que siguen activos después de un tiempo — cargado a mano. */
  retentionRate: number | null;
  bestSource: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateVacancyInput = Omit<
  Vacancy,
  "id" | "createdAt" | "updatedAt" | "stages" | "closedAt" | "candidatesReceived" | "daysToFirstInterview" | "daysToFirstOffer" | "retentionRate" | "bestSource"
> & {
  stages: Array<{ name: string; order: number; isTerminal?: boolean; count?: number }>;
  candidatesReceived?: number;
  daysToFirstInterview?: number | null;
  daysToFirstOffer?: number | null;
  retentionRate?: number | null;
  bestSource?: string;
};

export interface TimeToFillPrediction {
  estimatedDays: number;
  confidence: "Alta" | "Media" | "Baja";
  reasoning: string;
  benchmarkDays: number;
}
