import { supabase, throwIfError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import { generateInsights } from "../../lib/ai";
import type { PaginatedResult } from "../../api/types";
import type { CreateInsightInput, Insight, InsightType } from "./types";
import type { Vacancy } from "../vacancy/types";
import type { Application } from "../kanban/types";
import type { Candidate } from "../candidate/types";
import type { OnboardingEntry } from "../onboarding/types";
import type { ConsultingLead } from "../consulting/types";
import type { Employee } from "../people/types";

interface InsightRow {
  id: string;
  type: string;
  text: string;
  area: string | null;
  source: string;
  date: string;
  created_at: string;
}

function fromRow(row: InsightRow): Insight {
  return {
    id: row.id,
    type: row.type as InsightType,
    text: row.text,
    area: row.area ?? undefined,
    source: row.source as Insight["source"],
    date: row.date,
    createdAt: row.created_at,
  };
}

export const insightsApi = {
  list: async (): Promise<PaginatedResult<Insight>> => {
    const { data, error } = await supabase.from("insights").select("*").order("created_at", { ascending: false }).limit(100);
    throwIfError(error);
    return paginate((data as InsightRow[]).map(fromRow));
  },

  create: async (input: CreateInsightInput): Promise<Insight> => {
    const { data, error } = await supabase
      .from("insights")
      .insert({ type: input.type, text: input.text, area: input.area, source: "manual", date: new Date().toISOString().slice(0, 10) })
      .select("*")
      .single();
    throwIfError(error);
    return fromRow(data as InsightRow);
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("insights").delete().eq("id", id);
    throwIfError(error);
  },

  generateWithAi: async (): Promise<Insight[]> => {
    const [vacanciesRes, applicationsRes, candidatesRes, onboardingsRes, leadsRes, employeesRes] = await Promise.all([
      supabase.from("vacancies").select("*"),
      supabase.from("applications").select("*"),
      supabase.from("candidates").select("*"),
      supabase.from("onboardings").select("*"),
      supabase.from("consulting_leads").select("*"),
      supabase.from("employees").select("*"),
    ]);
    for (const res of [vacanciesRes, applicationsRes, candidatesRes, onboardingsRes, leadsRes, employeesRes]) throwIfError(res.error);

    const vacancies = (vacanciesRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id, title: r.title, status: r.status, createdAt: r.created_at, requiredSkills: r.required_skills, workModel: r.work_model, seniority: r.seniority,
    })) as unknown as Vacancy[];
    const applications = (applicationsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id, candidateId: r.candidate_id, vacancyId: r.vacancy_id, currentStage: r.current_stage, status: r.status, matchScore: r.match_score, createdAt: r.created_at, updatedAt: r.updated_at,
    })) as unknown as Application[];
    const candidates = (candidatesRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id, skills: r.skills, vacancyId: r.vacancy_id,
    })) as unknown as Candidate[];
    const onboardings = (onboardingsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id, employeeName: r.employee_name, startDate: r.start_date, progress: r.progress,
    })) as unknown as OnboardingEntry[];
    const consultingLeads = (leadsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id, company: r.company, sector: r.sector, size: r.size, need: r.need, status: r.status, value: r.value, createdAt: r.created_at,
    })) as unknown as ConsultingLead[];
    const employees = (employeesRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id, name: r.name, lifecycle: r.lifecycle, status: r.status,
    })) as unknown as Employee[];

    const generated = generateInsights({ vacancies, applications, candidates, onboardings, consultingLeads, employees });
    if (!generated.length) return [];

    const today = new Date().toISOString().slice(0, 10);
    const rows = generated.map((g) => ({ type: g.type, text: g.text, area: g.area, source: "ai", date: today }));
    const { data, error } = await supabase.from("insights").insert(rows).select("*");
    throwIfError(error);
    return (data as InsightRow[]).map(fromRow);
  },
};
