import { supabase, throwIfError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import { buildSyntheticResumeText, extractResumeData } from "../../lib/ai";
import type { PaginatedResult } from "../../api/types";
import type { Candidate, CreateCandidateInput, EducationEntry, ExperienceEntry, ResumeParseResult, UpdateCandidateInput } from "./types";

export interface CandidateQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vacancyId?: string;
  talentPoolOnly?: boolean;
  skills?: string[];
  locations?: string[];
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

function toRow(input: Partial<CreateCandidateInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.email !== undefined) row.email = input.email;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.location !== undefined) row.location = input.location;
  if (input.avatar !== undefined) row.avatar = input.avatar;
  if (input.resumeUrl !== undefined) row.resume_url = input.resumeUrl;
  if (input.resumeText !== undefined) row.resume_text = input.resumeText;
  if (input.experience !== undefined) row.experience = input.experience;
  if (input.education !== undefined) row.education = input.education;
  if (input.skills !== undefined) row.skills = input.skills;
  if (input.languages !== undefined) row.languages = input.languages;
  if (input.seniority !== undefined) row.seniority = input.seniority;
  if (input.linkedin !== undefined) row.linkedin = input.linkedin;
  if (input.portfolio !== undefined) row.portfolio = input.portfolio;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.vacancyId !== undefined) row.vacancy_id = input.vacancyId;
  return row;
}

export const candidateApi = {
  list: async (params: CandidateQueryParams = {}): Promise<PaginatedResult<Candidate>> => {
    let query = supabase.from("candidates").select("*").order("created_at", { ascending: false });
    if (params.search) query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    if (params.vacancyId) query = query.eq("vacancy_id", params.vacancyId);
    if (params.talentPoolOnly) query = query.is("vacancy_id", null);
    if (params.skills?.length) query = query.overlaps("skills", params.skills);
    if (params.locations?.length) query = query.in("location", params.locations);
    const { data, error } = await query;
    throwIfError(error);
    return paginate((data as CandidateRow[]).map(fromRow), params.page ?? 1, params.limit);
  },

  getById: async (id: string): Promise<Candidate> => {
    const { data, error } = await supabase.from("candidates").select("*").eq("id", id).single();
    throwIfError(error);
    return fromRow(data as CandidateRow);
  },

  create: async (input: Partial<CreateCandidateInput>): Promise<Candidate> => {
    const row = toRow(input);
    if (!row.experience) row.experience = [];
    if (!row.education) row.education = [];
    if (!row.skills) row.skills = [];
    if (!row.languages) row.languages = [];
    const { data, error } = await supabase.from("candidates").insert(row).select("*").single();
    throwIfError(error);
    return fromRow(data as CandidateRow);
  },

  update: async (id: string, input: UpdateCandidateInput): Promise<Candidate> => {
    const { data, error } = await supabase.from("candidates").update(toRow(input)).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as CandidateRow);
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    throwIfError(error);
  },

  countsByVacancy: async (vacancyIds: string[]): Promise<Record<string, number>> => {
    if (!vacancyIds.length) return {};
    const { data, error } = await supabase.from("candidates").select("vacancy_id").in("vacancy_id", vacancyIds);
    throwIfError(error);
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as Array<{ vacancy_id: string }>) {
      counts[row.vacancy_id] = (counts[row.vacancy_id] ?? 0) + 1;
    }
    return counts;
  },

  /**
   * Este app não extrai o conteúdo binário real do PDF/DOCX — gera um texto
   * de currículo plausível a partir do nome do arquivo (ver lib/ai.ts), o
   * suficiente para exercitar o fluxo completo de ponta a ponta. O arquivo
   * em si é enviado de verdade ao Supabase Storage.
   */
  parseResume: async (file: File): Promise<ResumeParseResult> => {
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
    throwIfError(uploadError);
    const { data: publicUrlData } = supabase.storage.from("resumes").getPublicUrl(path);

    const resumeText = buildSyntheticResumeText(file.name);
    const extracted = extractResumeData(resumeText);
    return { extracted, resumeUrl: publicUrlData.publicUrl, resumeText };
  },
};
