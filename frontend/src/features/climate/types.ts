export const ROUND_STATUSES = ["Borrador", "Activa", "Cerrada"] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

export const AUDIENCES = ["Toda la empresa", "Equipo específico"] as const;
export type Audience = (typeof AUDIENCES)[number];

/** Dimensiones estándar de clima organizacional — seleccionables al crear una ronda. */
export const CLIMATE_CATEGORIES = [
  "Satisfacción general",
  "Cultura y pertenencia",
  "Comunicación interna",
  "Liderazgo",
  "Desarrollo profesional",
  "Organización y procesos",
  "Bienestar",
] as const;

export interface ClimateSurveyRound {
  id: string;
  name: string;
  roundDate: string;
  respondents: number;
  notes: string;
  status: RoundStatus;
  startDate: string | null;
  endDate: string | null;
  audience: Audience;
  audienceTeam: string;
  categories: string[];
  /** eNPS (-100 a 100) — métrica separada de la satisfacción, nunca combinada en un solo puntaje. */
  enps: number | null;
  /** Dotación objetivo para calcular la tasa de participación (si no se define, se usa el headcount activo de People cuando el público es "Toda la empresa"). */
  targetHeadcount: number | null;
  /** Resumen narrativo generado por el asistente de IA — editable a mano. */
  aiSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClimateSurveyRoundInput {
  name: string;
  roundDate: string;
  respondents?: number;
  notes?: string;
  status?: RoundStatus;
  startDate?: string | null;
  endDate?: string | null;
  audience?: Audience;
  audienceTeam?: string;
  categories?: string[];
  enps?: number | null;
  targetHeadcount?: number | null;
  aiSummary?: string;
}

export interface ClimateSurveyResult {
  id: string;
  roundId: string;
  category: string;
  score: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClimateSurveyResultInput {
  roundId: string;
  category: string;
  score: number;
  comment?: string;
}

/** Escala sugerida para los puntajes (0 a 10) — usada para normalizar los gráficos. */
export const CLIMATE_SCORE_MAX = 10;

// ── Fortalezas y oportunidades ──────────────────────────────────────────────

export const THEME_NOTE_KINDS = ["fortaleza", "oportunidad"] as const;
export type ThemeNoteKind = (typeof THEME_NOTE_KINDS)[number];

export type NoteOrigin = "manual" | "ia";

export interface ClimateThemeNote {
  id: string;
  roundId: string;
  kind: ThemeNoteKind;
  theme: string;
  result: number | null;
  insight: string;
  suggestion: string;
  origin: NoteOrigin;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClimateThemeNoteInput {
  roundId: string;
  kind: ThemeNoteKind;
  theme: string;
  result?: number | null;
  insight?: string;
  suggestion?: string;
  origin?: NoteOrigin;
}

// ── Plan de acción ───────────────────────────────────────────────────────────

export const ACTION_PRIORITIES = ["Alta", "Media", "Baja"] as const;
export type ActionPriority = (typeof ACTION_PRIORITIES)[number];

export const ACTION_STATUSES = ["Pendiente", "En curso", "Completado"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export interface ClimateActionItem {
  id: string;
  roundId: string;
  name: string;
  description: string;
  owner: string;
  dueDate: string | null;
  priority: ActionPriority;
  status: ActionStatus;
  origin: NoteOrigin;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClimateActionItemInput {
  roundId: string;
  name: string;
  description?: string;
  owner?: string;
  dueDate?: string | null;
  priority?: ActionPriority;
  status?: ActionStatus;
  origin?: NoteOrigin;
}
