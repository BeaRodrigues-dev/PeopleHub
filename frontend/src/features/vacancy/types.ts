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

// ── clasificación de etapas del pipeline ────────────────────────────────────
// La etapa "terminal" (la última de la lista) no siempre significa
// "contratado" — puede ser, por ejemplo, "Rechazado". Por eso identificamos
// contratación/descarte por el NOMBRE de la etapa, no por su posición.

const HIRE_NAME_RE = /contrat|hired|aceptad/i;
const REJECT_NAME_RE = /rechaz|descart|declin|perdid|desist/i;

/** ¿Esta etapa representa una contratación? (por nombre, no por ser la última de la lista). */
export function isHireStage(stage: Pick<PipelineStage, "name">): boolean {
  return HIRE_NAME_RE.test(stage.name);
}

/** ¿Esta etapa representa un descarte/rechazo? (por nombre). */
export function isRejectStage(stage: Pick<PipelineStage, "name">): boolean {
  return REJECT_NAME_RE.test(stage.name);
}

/** ¿Esta etapa es una "salida" del proceso (contratación, rechazo, o terminal genérica) — ya no cuenta como candidato activo en curso. */
export function isExitStage(stage: Pick<PipelineStage, "name" | "isTerminal">): boolean {
  return !!stage.isTerminal || isHireStage(stage) || isRejectStage(stage);
}

/** Suma de personas en la(s) etapa(s) de contratación de una vaga (si ninguna etapa matchea por nombre, usa la etapa terminal como respaldo). */
export function countHires(stages: PipelineStage[]): number {
  const named = stages.filter(isHireStage);
  const source = named.length ? named : stages.filter((s) => s.isTerminal && !isRejectStage(s));
  return source.reduce((sum, s) => sum + (s.count ?? 0), 0);
}

/** Suma de personas todavía en curso (ni contratadas ni rechazadas/terminal). */
export function countInProcess(stages: PipelineStage[]): number {
  return stages.filter((s) => !isExitStage(s)).reduce((sum, s) => sum + (s.count ?? 0), 0);
}
