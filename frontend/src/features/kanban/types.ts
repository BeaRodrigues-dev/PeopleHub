import type { Candidate } from "../candidate/types";

export const APPLICATION_STATUSES = ["ACTIVE", "REJECTED", "HIRED", "WITHDRAWN"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface AiEvaluation {
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  recommendation?: string;
  reasoning?: string;
  evaluatedAt: string;
  provider?: string;
}

/** Candidatura (candidato x vaga). Quando `populate=candidate`, `candidateId` vem populado com o objeto completo. */
export interface Application {
  id: string;
  candidateId: string | Candidate;
  vacancyId: string;
  currentStage: string;
  matchScore?: number | null;
  status: ApplicationStatus;
  aiEvaluation?: AiEvaluation | null;
  createdAt: string;
  updatedAt: string;
}

export function getApplicationCandidate(application: Application): Candidate | null {
  return typeof application.candidateId === "string" ? null : application.candidateId;
}
