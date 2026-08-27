import { supabase, throwIfError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import { computeProgress, suggestOnboardingChecklist } from "../../lib/ai";
import type { PaginatedResult } from "../../api/types";
import { DEFAULT_CHECKLIST, type ChecklistPhase, type CreateOnboardingInput, type OnboardingChecklist, type OnboardingEntry, type OnboardingStatus } from "./types";

interface OnboardingRow {
  id: string;
  employee_name: string;
  role: string;
  start_date: string;
  status: string;
  checklist: OnboardingChecklist;
  progress: number;
  created_at: string;
  updated_at: string;
}

function fromRow(row: OnboardingRow): OnboardingEntry {
  return {
    id: row.id,
    employeeName: row.employee_name,
    role: row.role,
    startDate: row.start_date,
    progress: row.progress,
    status: row.status as OnboardingStatus,
    checklist: row.checklist,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function statusFromProgress(progress: number): OnboardingStatus {
  return progress >= 100 ? "Completed" : progress > 0 ? "In Progress" : "Started";
}

export const onboardingApi = {
  list: async (): Promise<PaginatedResult<OnboardingEntry>> => {
    const { data, error } = await supabase.from("onboardings").select("*").order("created_at", { ascending: false }).limit(100);
    throwIfError(error);
    return paginate((data as OnboardingRow[]).map(fromRow));
  },

  getById: async (id: string): Promise<OnboardingEntry> => {
    const { data, error } = await supabase.from("onboardings").select("*").eq("id", id).single();
    throwIfError(error);
    return fromRow(data as OnboardingRow);
  },

  create: async (input: CreateOnboardingInput): Promise<OnboardingEntry> => {
    const checklist = input.checklist ?? DEFAULT_CHECKLIST;
    const { data, error } = await supabase
      .from("onboardings")
      .insert({
        employee_name: input.employeeName,
        role: input.role,
        start_date: input.startDate,
        status: "Started",
        checklist,
        progress: computeProgress(checklist),
      })
      .select("*")
      .single();
    throwIfError(error);
    return fromRow(data as OnboardingRow);
  },

  update: async (id: string, input: Partial<CreateOnboardingInput>): Promise<OnboardingEntry> => {
    const row: Record<string, unknown> = {};
    if (input.employeeName !== undefined) row.employee_name = input.employeeName;
    if (input.role !== undefined) row.role = input.role;
    if (input.startDate !== undefined) row.start_date = input.startDate;
    if (input.checklist !== undefined) {
      row.checklist = input.checklist;
      row.progress = computeProgress(input.checklist);
      row.status = statusFromProgress(row.progress as number);
    }
    const { data, error } = await supabase.from("onboardings").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as OnboardingRow);
  },

  toggleItem: async (id: string, phase: ChecklistPhase, index: number): Promise<OnboardingEntry> => {
    const { data: current, error: fetchError } = await supabase.from("onboardings").select("checklist").eq("id", id).single();
    throwIfError(fetchError);
    if (!current) throw new Error("Onboarding não encontrado.");
    const checklist = current.checklist as OnboardingChecklist;
    if (!checklist[phase]?.[index]) throw new Error("Item de checklist inválido");
    checklist[phase][index].done = !checklist[phase][index].done;
    const progress = computeProgress(checklist);
    const { data, error } = await supabase
      .from("onboardings")
      .update({ checklist, progress, status: statusFromProgress(progress) })
      .eq("id", id)
      .select("*")
      .single();
    throwIfError(error);
    return fromRow(data as OnboardingRow);
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("onboardings").delete().eq("id", id);
    throwIfError(error);
  },

  suggestChecklist: async (role: string): Promise<OnboardingChecklist> => suggestOnboardingChecklist(role),
};
