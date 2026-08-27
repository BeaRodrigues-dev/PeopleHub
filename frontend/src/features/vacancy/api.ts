import { supabase, throwIfError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import { predictTimeToFill } from "../../lib/ai";
import type { PaginatedResult } from "../../api/types";
import type { Application } from "../kanban/types";
import type { CreateVacancyInput, PipelineStage, TimeToFillPrediction, Vacancy, VacancyStatus } from "./types";

export interface VacancyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VacancyStatus;
}

interface VacancyRow {
  id: string;
  title: string;
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  department: string | null;
  location: string | null;
  work_model: string;
  seniority: string | null;
  status: string;
  required_skills: string[];
  stages: PipelineStage[];
  created_at: string;
  updated_at: string;
}

function fromRow(row: VacancyRow): Vacancy {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    responsibilities: row.responsibilities ?? undefined,
    requirements: row.requirements ?? undefined,
    department: row.department ?? undefined,
    location: row.location ?? undefined,
    workModel: row.work_model as Vacancy["workModel"],
    seniority: row.seniority ?? undefined,
    status: row.status as VacancyStatus,
    requiredSkills: row.required_skills ?? [],
    stages: (row.stages ?? []) as PipelineStage[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: Partial<CreateVacancyInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.responsibilities !== undefined) row.responsibilities = input.responsibilities;
  if (input.requirements !== undefined) row.requirements = input.requirements;
  if (input.department !== undefined) row.department = input.department;
  if (input.location !== undefined) row.location = input.location;
  if (input.workModel !== undefined) row.work_model = input.workModel;
  if (input.seniority !== undefined) row.seniority = input.seniority;
  if (input.status !== undefined) row.status = input.status;
  if (input.requiredSkills !== undefined) row.required_skills = input.requiredSkills;
  return row;
}

/** Gera ids estáveis para as etapas do pipeline, reaproveitando os ids existentes (por posição) quando disponíveis. */
function buildStages(stages: CreateVacancyInput["stages"], existing?: PipelineStage[]): PipelineStage[] {
  return stages.map((s, i) => ({
    id: existing?.[i]?.id || crypto.randomUUID(),
    name: s.name,
    order: i,
    isTerminal: i === stages.length - 1,
  }));
}

export const vacancyApi = {
  list: async (params: VacancyQueryParams = {}): Promise<PaginatedResult<Vacancy>> => {
    let query = supabase.from("vacancies").select("*").order("created_at", { ascending: false });
    if (params.status) query = query.eq("status", params.status);
    if (params.search) query = query.ilike("title", `%${params.search}%`);
    const { data, error } = await query;
    throwIfError(error);
    return paginate((data as VacancyRow[]).map(fromRow), params.page ?? 1, params.limit);
  },

  getById: async (id: string): Promise<Vacancy> => {
    const { data, error } = await supabase.from("vacancies").select("*").eq("id", id).single();
    throwIfError(error);
    return fromRow(data as VacancyRow);
  },

  create: async (input: CreateVacancyInput): Promise<Vacancy> => {
    const row = { ...toRow(input), stages: buildStages(input.stages) };
    const { data, error } = await supabase.from("vacancies").insert(row).select("*").single();
    throwIfError(error);
    return fromRow(data as VacancyRow);
  },

  update: async (id: string, input: Partial<CreateVacancyInput>): Promise<Vacancy> => {
    const row = toRow(input);
    if (input.stages !== undefined) {
      const { data: current } = await supabase.from("vacancies").select("stages").eq("id", id).single();
      row.stages = buildStages(input.stages, (current?.stages ?? []) as PipelineStage[]);
    }
    const { data, error } = await supabase.from("vacancies").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as VacancyRow);
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("vacancies").delete().eq("id", id);
    throwIfError(error);
  },

  timeToFill: async (id: string): Promise<TimeToFillPrediction> => {
    const vacancy = await vacancyApi.getById(id);
    const { data, error } = await supabase.from("applications").select("*").eq("vacancy_id", id);
    throwIfError(error);
    const applications: Application[] = ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string,
      candidateId: r.candidate_id as string,
      vacancyId: r.vacancy_id as string,
      currentStage: r.current_stage as string,
      matchScore: r.match_score as number | null,
      status: r.status as Application["status"],
      aiEvaluation: r.ai_evaluation as Application["aiEvaluation"],
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }));
    return predictTimeToFill(vacancy, applications);
  },
};
