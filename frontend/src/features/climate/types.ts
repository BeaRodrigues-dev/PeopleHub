export interface ClimateSurveyRound {
  id: string;
  name: string;
  roundDate: string;
  respondents: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClimateSurveyRoundInput {
  name: string;
  roundDate: string;
  respondents?: number;
  notes?: string;
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
