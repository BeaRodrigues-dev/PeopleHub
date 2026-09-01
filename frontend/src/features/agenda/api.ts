import { supabase, throwIfError } from "../../lib/supabaseClient";
import type { AgendaCategory, AgendaEvent, CreateAgendaEventInput } from "./types";

interface AgendaEventRow {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  notes: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

function fromRow(row: AgendaEventRow): AgendaEvent {
  return {
    id: row.id,
    title: row.title,
    eventDate: row.event_date,
    eventTime: row.event_time,
    notes: row.notes ?? "",
    category: row.category as AgendaCategory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const agendaApi = {
  list: async (): Promise<AgendaEvent[]> => {
    const { data, error } = await supabase.from("agenda_events").select("*").order("event_date", { ascending: true });
    throwIfError(error);
    return (data as AgendaEventRow[]).map(fromRow);
  },
  create: async (input: CreateAgendaEventInput): Promise<AgendaEvent> => {
    const { data, error } = await supabase
      .from("agenda_events")
      .insert({
        title: input.title,
        event_date: input.eventDate,
        event_time: input.eventTime || null,
        notes: input.notes ?? "",
        category: input.category,
      })
      .select("*")
      .single();
    throwIfError(error);
    return fromRow(data as AgendaEventRow);
  },
  update: async (id: string, input: Partial<CreateAgendaEventInput>): Promise<AgendaEvent> => {
    const row: Record<string, unknown> = {};
    if (input.title !== undefined) row.title = input.title;
    if (input.eventDate !== undefined) row.event_date = input.eventDate;
    if (input.eventTime !== undefined) row.event_time = input.eventTime || null;
    if (input.notes !== undefined) row.notes = input.notes;
    if (input.category !== undefined) row.category = input.category;
    const { data, error } = await supabase.from("agenda_events").update(row).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as AgendaEventRow);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("agenda_events").delete().eq("id", id);
    throwIfError(error);
  },
};
