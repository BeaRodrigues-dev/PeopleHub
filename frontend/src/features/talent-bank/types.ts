import type { Candidate } from "../candidate/types";

export interface TalentBankMatch {
  candidate: Candidate;
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  recommendation?: string;
  reasoning?: string;
}
