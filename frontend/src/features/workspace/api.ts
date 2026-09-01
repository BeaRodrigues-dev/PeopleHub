import { supabase, throwIfError } from "../../lib/supabaseClient";
import type {
  CreateCustomKpiInput,
  CreateCustomNoteInput,
  CreateCustomTaskInput,
  CustomKpi,
  CustomNote,
  CustomTask,
  WorkspaceCategory,
} from "./types";

interface CustomKpiRow {
  id: string;
  label: string;
  value: number;
  unit: string;
  category: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomTaskRow {
  id: string;
  text: string;
  done: boolean;
  category: string;
  due_date: string | null;
  created_at: string;
}

interface CustomNoteRow {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  updated_at: string;
}

function kpiFromRow(row: CustomKpiRow): CustomKpi {
  return {
    id: row.id,
    label: row.label,
    value: Number(row.value),
    unit: row.unit ?? "",
    category: row.category as WorkspaceCategory,
    note: row.note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function taskFromRow(row: CustomTaskRow): CustomTask {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    category: row.category as WorkspaceCategory,
    dueDate: row.due_date ?? null,
    createdAt: row.created_at,
  };
}

function noteFromRow(row: CustomNoteRow): CustomNote {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category as WorkspaceCategory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const customKpiApi = {
  list: async (): Promise<CustomKpi[]> => {
    const { data, error } = await supabase.from("custom_kpis").select("*").order("created_at", { ascending: true });
    throwIfError(error);
    return (data as CustomKpiRow[]).map(kpiFromRow);
  },
  create: async (input: CreateCustomKpiInput): Promise<CustomKpi> => {
    const { data, error } = await supabase
      .from("custom_kpis")
      .insert({ label: input.label, value: input.value, unit: input.unit ?? "", category: input.category, note: input.note ?? "" })
      .select("*")
      .single();
    throwIfError(error);
    return kpiFromRow(data as CustomKpiRow);
  },
  update: async (id: string, input: Partial<CreateCustomKpiInput>): Promise<CustomKpi> => {
    const row: Record<string, unknown> = {};
    if (input.label !== undefined) row.label = input.label;
    if (input.value !== undefined) row.value = input.value;
    if (input.unit !== undefined) row.unit = input.unit;
    if (input.category !== undefined) row.category = input.category;
    if (input.note !== undefined) row.note = input.note;
    const { data, error } = await supabase.from("custom_kpis").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return kpiFromRow(data as CustomKpiRow);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("custom_kpis").delete().eq("id", id);
    throwIfError(error);
  },
};

export const customTaskApi = {
  list: async (): Promise<CustomTask[]> => {
    const { data, error } = await supabase.from("custom_tasks").select("*").order("created_at", { ascending: true });
    throwIfError(error);
    return (data as CustomTaskRow[]).map(taskFromRow);
  },
  create: async (input: CreateCustomTaskInput): Promise<CustomTask> => {
    const { data, error } = await supabase
      .from("custom_tasks")
      .insert({ text: input.text, category: input.category, due_date: input.dueDate || null, done: false })
      .select("*")
      .single();
    throwIfError(error);
    return taskFromRow(data as CustomTaskRow);
  },
  toggle: async (id: string, done: boolean): Promise<CustomTask> => {
    const { data, error } = await supabase.from("custom_tasks").update({ done }).eq("id", id).select("*").single();
    throwIfError(error);
    return taskFromRow(data as CustomTaskRow);
  },
  updateDueDate: async (id: string, dueDate: string | null): Promise<CustomTask> => {
    const { data, error } = await supabase.from("custom_tasks").update({ due_date: dueDate }).eq("id", id).select("*").single();
    throwIfError(error);
    return taskFromRow(data as CustomTaskRow);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("custom_tasks").delete().eq("id", id);
    throwIfError(error);
  },
};

export const customNoteApi = {
  list: async (): Promise<CustomNote[]> => {
    const { data, error } = await supabase.from("custom_notes").select("*").order("created_at", { ascending: false });
    throwIfError(error);
    return (data as CustomNoteRow[]).map(noteFromRow);
  },
  create: async (input: CreateCustomNoteInput): Promise<CustomNote> => {
    const { data, error } = await supabase
      .from("custom_notes")
      .insert({ title: input.title, body: input.body, category: input.category })
      .select("*")
      .single();
    throwIfError(error);
    return noteFromRow(data as CustomNoteRow);
  },
  update: async (id: string, input: Partial<CreateCustomNoteInput>): Promise<CustomNote> => {
    const row: Record<string, unknown> = {};
    if (input.title !== undefined) row.title = input.title;
    if (input.body !== undefined) row.body = input.body;
    if (input.category !== undefined) row.category = input.category;
    const { data, error } = await supabase.from("custom_notes").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return noteFromRow(data as CustomNoteRow);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("custom_notes").delete().eq("id", id);
    throwIfError(error);
  },
};
