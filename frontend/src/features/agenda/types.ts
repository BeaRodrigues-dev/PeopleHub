export const AGENDA_CATEGORIES = ["Personal", "Empresa"] as const;
export type AgendaCategory = (typeof AGENDA_CATEGORIES)[number];

export interface AgendaEvent {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string | null;
  notes: string;
  category: AgendaCategory;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgendaEventInput {
  title: string;
  eventDate: string;
  eventTime?: string | null;
  notes?: string;
  category: AgendaCategory;
}
