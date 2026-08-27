import { supabase, throwIfError, SupabaseOpError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import { matchCandidateToVacancy } from "../../lib/ai";
import type { PaginatedResult } from "../../api/types";
import type { Candidate, EducationEntry, ExperienceEntry } from "../candidate/types";
import type { Application, ApplicationStatus } from "./types";

interface ApplicationRow {
  id: string;
  candidate_id: string;
  vacancy_id: string;
  current_stage: string;
  match_score: number | null;
  status: string;
  ai_evaluation: Application["aiEvaluation"];
  created_at: string;
  updated_at: string;
  candidate?: CandidateRow | null;
}

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

function mapCandidateRow(row: CandidateRow): Candidate {
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

function fromRow(row: ApplicationRow): Application {
  return {
    id: row.id,
    candidateId: row.candidate ? mapCandidateRow(row.candidate) : row.candidate_id,
    vacancyId: row.vacancy_id,
    currentStage: row.current_stage,
    matchScore: row.match_score,
    status: row.status as ApplicationStatus,
    aiEvaluation: row.ai_evaluation ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const applicationApi = {
  listAll: async (): Promise<PaginatedResult<Application>> => {
    const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false }).limit(500);
    throwIfError(error);
    return paginate((data as ApplicationRow[]).map(fromRow));
  },

  listByVacancy: async (vacancyId: string): Promise<PaginatedResult<Application>> => {
    const { data, error } = await supabase
      .from("applications")
      .select("*, candidate:candidates(*)")
      .eq("vacancy_id", vacancyId)
      .order("created_at", { ascending: false })
      .limit(500);
    throwIfError(error);
    return paginate((data as ApplicationRow[]).map(fromRow));
  },

  listByCandidate: async (candidateId: string): Promise<PaginatedResult<Application>> => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false })
      .limit(100);
    throwIfError(error);
    return paginate((data as ApplicationRow[]).map(fromRow));
  },

  create: async (input: { candidateId: string; vacancyId: string; currentStage?: string }): Promise<Application> => {
    let currentStage = input.currentStage;
    if (!currentStage) {
      const { data: vacancy } = await supabase.from("vacancies").select("stages").eq("id", input.vacancyId).single();
      const stages = (vacancy?.stages ?? []) as Array<{ name: string; order: number }>;
      currentStage = [...stages].sort((a, b) => a.order - b.order)[0]?.name ?? "Candidatura";
    }
    const { data, error } = await supabase
      .from("applications")
      .insert({ candidate_id: input.candidateId, vacancy_id: input.vacancyId, current_stage: currentStage, status: "ACTIVE" })
      .select("*")
      .single();
    throwIfError(error);
    // Marca o candidato como "em processo" nesta vaga (espelha o comportamento anterior do mock-backend).
    await supabase.from("candidates").update({ vacancy_id: input.vacancyId }).eq("id", input.candidateId);
    return fromRow(data as ApplicationRow);
  },

  moveStage: async (id: string, stage: string): Promise<Application> => {
    const { data, error } = await supabase.from("applications").update({ current_stage: stage }).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as ApplicationRow);
  },

  updateStatus: async (id: string, status: ApplicationStatus): Promise<Application> => {
    const { data, error } = await supabase.from("applications").update({ status }).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as ApplicationRow);
  },

  evaluate: async (id: string): Promise<Application> => {
    const { data: app, error: appError } = await supabase.from("applications").select("*").eq("id", id).single();
    throwIfError(appError);
    if (!app) throw new SupabaseOpError("Candidatura não encontrada.");

    const [{ data: vacancy, error: vacancyError }, { data: candidate, error: candidateError }] = await Promise.all([
      supabase.from("vacancies").select("required_skills").eq("id", app.vacancy_id).single(),
      supabase.from("candidates").select("skills").eq("id", app.candidate_id).single(),
    ]);
    throwIfError(vacancyError);
    throwIfError(candidateError);
    if (!vacancy || !candidate) throw new SupabaseOpError("Vaga ou candidato não encontrado.");

    const result = matchCandidateToVacancy({ requiredSkills: vacancy.required_skills ?? [] }, { skills: candidate.skills ?? [] });
    const aiEvaluation = { ...result, evaluatedAt: new Date().toISOString(), provider: "heuristic" };

    const { data, error } = await supabase
      .from("applications")
      .update({ match_score: result.matchScore, ai_evaluation: aiEvaluation })
      .eq("id", id)
      .select("*")
      .single();
    throwIfError(error);
    return fromRow(data as ApplicationRow);
  },

  remove: async (id: string): Promise<void> => {
    const { data: app } = await supabase.from("applications").select("candidate_id, vacancy_id").eq("id", id).single();
    const { error } = await supabase.from("applications").delete().eq("id", id);
    throwIfError(error);
    if (app) {
      const { data: candidate } = await supabase.from("candidates").select("vacancy_id").eq("id", app.candidate_id).single();
      if (candidate && candidate.vacancy_id === app.vacancy_id) {
        await supabase.from("candidates").update({ vacancy_id: null }).eq("id", app.candidate_id);
      }
    }
  },
};
