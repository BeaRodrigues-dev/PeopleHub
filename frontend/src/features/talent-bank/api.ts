import { supabase, throwIfError, SupabaseOpError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import { matchCandidateToVacancy } from "../../lib/ai";
import type { PaginatedResult } from "../../api/types";
import type { CandidateQueryParams } from "../candidate/api";
import type { Candidate, EducationEntry, ExperienceEntry } from "../candidate/types";
import { applicationApi } from "../kanban/api";
import type { TalentBankMatch } from "./types";

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  resume_url: string | null;
  resume_text: string | null;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  languages: string[];
  seniority: string | null;
  linkedin: string | null;
  portfolio: string | null;
  notes: string | null;
  vacancy_id: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(row: CandidateRow): Candidate {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    location: row.location ?? undefined,
    avatar: row.avatar,
    resumeUrl: row.resume_url,
    resumeText: row.resume_text,
    experience: row.experience ?? [],
    education: row.education ?? [],
    skills: row.skills ?? [],
    languages: row.languages ?? [],
    seniority: row.seniority ?? undefined,
    linkedin: row.linkedin ?? undefined,
    portfolio: row.portfolio ?? undefined,
    notes: row.notes ?? undefined,
    vacancyId: row.vacancy_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchPool(params: CandidateQueryParams = {}): Promise<Candidate[]> {
  let query = supabase.from("candidates").select("*").is("vacancy_id", null).order("created_at", { ascending: false });
  if (params.search) query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  if (params.skills?.length) query = query.overlaps("skills", params.skills);
  if (params.locations?.length) query = query.in("location", params.locations);
  const { data, error } = await query;
  throwIfError(error);
  return (data as CandidateRow[]).map(fromRow);
}

async function computeMatches(vacancyId: string): Promise<TalentBankMatch[]> {
  const { data: vacancy, error: vacancyError } = await supabase.from("vacancies").select("required_skills").eq("id", vacancyId).single();
  throwIfError(vacancyError);
  if (!vacancy) throw new SupabaseOpError("Vaga não encontrada.");
  const pool = await fetchPool();

  return pool
    .map((candidate) => {
      const result = matchCandidateToVacancy({ requiredSkills: vacancy.required_skills ?? [] }, { skills: candidate.skills });
      return {
        candidate,
        score: result.matchScore,
        matchingSkills: result.strengths,
        missingSkills: result.missingSkills,
        recommendation: result.recommendation,
        reasoning: result.reasoning,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export const talentBankApi = {
  list: async (params: CandidateQueryParams = {}): Promise<PaginatedResult<Candidate>> => {
    const items = await fetchPool(params);
    return paginate(items, params.page ?? 1, params.limit);
  },

  match: (vacancyId: string) => computeMatches(vacancyId),

  /** Não há um provider externo de IA configurado — reaproveita a mesma heurística, limitada aos 10 melhores colocados. */
  matchWithAi: async (vacancyId: string): Promise<TalentBankMatch[]> => (await computeMatches(vacancyId)).slice(0, 10),

  assign: async (candidateIds: string[], vacancyId: string): Promise<void> => {
    await Promise.all(candidateIds.map((candidateId) => applicationApi.create({ candidateId, vacancyId })));
  },
};
