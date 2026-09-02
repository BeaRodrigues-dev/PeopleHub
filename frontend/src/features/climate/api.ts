import { supabase, throwIfError } from "../../lib/supabaseClient";
import type {
  ActionPriority,
  ActionStatus,
  Audience,
  ClimateActionItem,
  ClimateSurveyResult,
  ClimateSurveyRound,
  ClimateThemeNote,
  CreateClimateActionItemInput,
  CreateClimateSurveyResultInput,
  CreateClimateSurveyRoundInput,
  CreateClimateThemeNoteInput,
  NoteOrigin,
  RoundStatus,
  ThemeNoteKind,
} from "./types";
import { AUDIENCES, CLIMATE_CATEGORIES } from "./types";

interface ClimateSurveyRoundRow {
  id: string;
  name: string;
  round_date: string;
  respondents: number;
  notes: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  audience: string;
  audience_team: string | null;
  categories: string[] | null;
  enps: number | null;
  target_headcount: number | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

interface ClimateSurveyResultRow {
  id: string;
  round_id: string;
  category: string;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface ClimateThemeNoteRow {
  id: string;
  round_id: string;
  kind: string;
  theme: string;
  result: number | null;
  insight: string | null;
  suggestion: string | null;
  origin: string;
  created_at: string;
  updated_at: string;
}

interface ClimateActionItemRow {
  id: string;
  round_id: string;
  name: string;
  description: string | null;
  owner: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  origin: string;
  created_at: string;
  updated_at: string;
}

function roundFromRow(row: ClimateSurveyRoundRow): ClimateSurveyRound {
  return {
    id: row.id,
    name: row.name,
    roundDate: row.round_date,
    respondents: row.respondents,
    notes: row.notes ?? "",
    status: (row.status as RoundStatus) ?? "Activa",
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    audience: (AUDIENCES as readonly string[]).includes(row.audience) ? (row.audience as Audience) : "Toda la empresa",
    audienceTeam: row.audience_team ?? "",
    categories: row.categories?.length ? row.categories : [...CLIMATE_CATEGORIES],
    enps: row.enps ?? null,
    targetHeadcount: row.target_headcount ?? null,
    aiSummary: row.ai_summary ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function resultFromRow(row: ClimateSurveyResultRow): ClimateSurveyResult {
  return {
    id: row.id,
    roundId: row.round_id,
    category: row.category,
    score: Number(row.score),
    comment: row.comment ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function themeNoteFromRow(row: ClimateThemeNoteRow): ClimateThemeNote {
  return {
    id: row.id,
    roundId: row.round_id,
    kind: row.kind as ThemeNoteKind,
    theme: row.theme,
    result: row.result === null ? null : Number(row.result),
    insight: row.insight ?? "",
    suggestion: row.suggestion ?? "",
    origin: (row.origin as NoteOrigin) ?? "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function actionItemFromRow(row: ClimateActionItemRow): ClimateActionItem {
  return {
    id: row.id,
    roundId: row.round_id,
    name: row.name,
    description: row.description ?? "",
    owner: row.owner ?? "",
    dueDate: row.due_date ?? null,
    priority: (row.priority as ActionPriority) ?? "Media",
    status: (row.status as ActionStatus) ?? "Pendiente",
    origin: (row.origin as NoteOrigin) ?? "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const climateRoundApi = {
  list: async (): Promise<ClimateSurveyRound[]> => {
    const { data, error } = await supabase.from("climate_survey_rounds").select("*").order("round_date", { ascending: true });
    throwIfError(error);
    return (data as ClimateSurveyRoundRow[]).map(roundFromRow);
  },
  create: async (input: CreateClimateSurveyRoundInput): Promise<ClimateSurveyRound> => {
    const { data, error } = await supabase
      .from("climate_survey_rounds")
      .insert({
        name: input.name,
        round_date: input.roundDate,
        respondents: input.respondents ?? 0,
        notes: input.notes ?? "",
        status: input.status ?? "Activa",
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        audience: input.audience ?? "Toda la empresa",
        audience_team: input.audienceTeam ?? "",
        categories: input.categories?.length ? input.categories : [...CLIMATE_CATEGORIES],
        enps: input.enps ?? null,
        target_headcount: input.targetHeadcount ?? null,
      })
      .select("*")
      .single();
    throwIfError(error);
    return roundFromRow(data as ClimateSurveyRoundRow);
  },
  update: async (id: string, input: Partial<CreateClimateSurveyRoundInput>): Promise<ClimateSurveyRound> => {
    const row: Record<string, unknown> = {};
    if (input.name !== undefined) row.name = input.name;
    if (input.roundDate !== undefined) row.round_date = input.roundDate;
    if (input.respondents !== undefined) row.respondents = input.respondents;
    if (input.notes !== undefined) row.notes = input.notes;
    if (input.status !== undefined) row.status = input.status;
    if (input.startDate !== undefined) row.start_date = input.startDate;
    if (input.endDate !== undefined) row.end_date = input.endDate;
    if (input.audience !== undefined) row.audience = input.audience;
    if (input.audienceTeam !== undefined) row.audience_team = input.audienceTeam;
    if (input.categories !== undefined) row.categories = input.categories;
    if (input.enps !== undefined) row.enps = input.enps;
    if (input.targetHeadcount !== undefined) row.target_headcount = input.targetHeadcount;
    if (input.aiSummary !== undefined) row.ai_summary = input.aiSummary;
    const { data, error } = await supabase.from("climate_survey_rounds").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return roundFromRow(data as ClimateSurveyRoundRow);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("climate_survey_rounds").delete().eq("id", id);
    throwIfError(error);
  },
};

export const climateResultApi = {
  list: async (): Promise<ClimateSurveyResult[]> => {
    const { data, error } = await supabase.from("climate_survey_results").select("*").order("created_at", { ascending: true });
    throwIfError(error);
    return (data as ClimateSurveyResultRow[]).map(resultFromRow);
  },
  create: async (input: CreateClimateSurveyResultInput): Promise<ClimateSurveyResult> => {
    const { data, error } = await supabase
      .from("climate_survey_results")
      .insert({ round_id: input.roundId, category: input.category, score: input.score, comment: input.comment ?? "" })
      .select("*")
      .single();
    throwIfError(error);
    return resultFromRow(data as ClimateSurveyResultRow);
  },
  update: async (id: string, input: Partial<CreateClimateSurveyResultInput>): Promise<ClimateSurveyResult> => {
    const row: Record<string, unknown> = {};
    if (input.category !== undefined) row.category = input.category;
    if (input.score !== undefined) row.score = input.score;
    if (input.comment !== undefined) row.comment = input.comment;
    const { data, error } = await supabase.from("climate_survey_results").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return resultFromRow(data as ClimateSurveyResultRow);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("climate_survey_results").delete().eq("id", id);
    throwIfError(error);
  },
};

export const climateThemeNoteApi = {
  list: async (): Promise<ClimateThemeNote[]> => {
    const { data, error } = await supabase.from("climate_theme_notes").select("*").order("created_at", { ascending: true });
    throwIfError(error);
    return (data as ClimateThemeNoteRow[]).map(themeNoteFromRow);
  },
  create: async (input: CreateClimateThemeNoteInput): Promise<ClimateThemeNote> => {
    const { data, error } = await supabase
      .from("climate_theme_notes")
      .insert({
        round_id: input.roundId,
        kind: input.kind,
        theme: input.theme,
        result: input.result ?? null,
        insight: input.insight ?? "",
        suggestion: input.suggestion ?? "",
        origin: input.origin ?? "manual",
      })
      .select("*")
      .single();
    throwIfError(error);
    return themeNoteFromRow(data as ClimateThemeNoteRow);
  },
  update: async (id: string, input: Partial<CreateClimateThemeNoteInput>): Promise<ClimateThemeNote> => {
    const row: Record<string, unknown> = {};
    if (input.theme !== undefined) row.theme = input.theme;
    if (input.result !== undefined) row.result = input.result;
    if (input.insight !== undefined) row.insight = input.insight;
    if (input.suggestion !== undefined) row.suggestion = input.suggestion;
    if (input.origin !== undefined) row.origin = input.origin;
    const { data, error } = await supabase.from("climate_theme_notes").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return themeNoteFromRow(data as ClimateThemeNoteRow);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("climate_theme_notes").delete().eq("id", id);
    throwIfError(error);
  },
};

export const climateActionItemApi = {
  list: async (): Promise<ClimateActionItem[]> => {
    const { data, error } = await supabase.from("climate_action_items").select("*").order("created_at", { ascending: true });
    throwIfError(error);
    return (data as ClimateActionItemRow[]).map(actionItemFromRow);
  },
  create: async (input: CreateClimateActionItemInput): Promise<ClimateActionItem> => {
    const { data, error } = await supabase
      .from("climate_action_items")
      .insert({
        round_id: input.roundId,
        name: input.name,
        description: input.description ?? "",
        owner: input.owner ?? "",
        due_date: input.dueDate ?? null,
        priority: input.priority ?? "Media",
        status: input.status ?? "Pendiente",
        origin: input.origin ?? "manual",
      })
      .select("*")
      .single();
    throwIfError(error);
    return actionItemFromRow(data as ClimateActionItemRow);
  },
  update: async (id: string, input: Partial<CreateClimateActionItemInput>): Promise<ClimateActionItem> => {
    const row: Record<string, unknown> = {};
    if (input.name !== undefined) row.name = input.name;
    if (input.description !== undefined) row.description = input.description;
    if (input.owner !== undefined) row.owner = input.owner;
    if (input.dueDate !== undefined) row.due_date = input.dueDate;
    if (input.priority !== undefined) row.priority = input.priority;
    if (input.status !== undefined) row.status = input.status;
    if (input.origin !== undefined) row.origin = input.origin;
    const { data, error } = await supabase.from("climate_action_items").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return actionItemFromRow(data as ClimateActionItemRow);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("climate_action_items").delete().eq("id", id);
    throwIfError(error);
  },
};
