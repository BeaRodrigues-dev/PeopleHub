import { supabase, throwIfError } from "../../lib/supabaseClient";
import type {
  ClimateSurveyResult,
  ClimateSurveyRound,
  CreateClimateSurveyResultInput,
  CreateClimateSurveyRoundInput,
} from "./types";

interface ClimateSurveyRoundRow {
  id: string;
  name: string;
  round_date: string;
  respondents: number;
  notes: string | null;
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

function roundFromRow(row: ClimateSurveyRoundRow): ClimateSurveyRound {
  return {
    id: row.id,
    name: row.name,
    roundDate: row.round_date,
    respondents: row.respondents,
    notes: row.notes ?? "",
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

export const climateRoundApi = {
  list: async (): Promise<ClimateSurveyRound[]> => {
    const { data, error } = await supabase.from("climate_survey_rounds").select("*").order("round_date", { ascending: true });
    throwIfError(error);
    return (data as ClimateSurveyRoundRow[]).map(roundFromRow);
  },
  create: async (input: CreateClimateSurveyRoundInput): Promise<ClimateSurveyRound> => {
    const { data, error } = await supabase
      .from("climate_survey_rounds")
      .insert({ name: input.name, round_date: input.roundDate, respondents: input.respondents ?? 0, notes: input.notes ?? "" })
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
