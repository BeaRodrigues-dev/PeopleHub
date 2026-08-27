import { supabase, throwIfError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import { qualifyConsultingLead } from "../../lib/ai";
import type { PaginatedResult } from "../../api/types";
import type { ConsultingLead, ConsultingService, ConsultingStatus, CreateConsultingLeadInput, UpdateConsultingLeadInput } from "./types";

interface ConsultingLeadRow {
  id: string;
  company: string;
  sector: string;
  size: string;
  contact: string;
  need: string;
  status: string;
  value: string;
  ai_qualification: ConsultingLead["aiQualification"];
  created_at: string;
  updated_at: string;
}

const CONSULTING_SERVICES: ConsultingService[] = [
  { id: "recruitment", name: "Recruitment", desc: "Atracción y selección de talento para empresas asociadas", price: "€800–2.400/vacante", icon: "🎯" },
  { id: "talent-hunting", name: "Talent Hunting", desc: "Búsqueda proactiva de perfiles estratégicos y headhunting", price: "€1.200–3.000/vacante", icon: "🕵️" },
  { id: "hr-setup", name: "HR Setup", desc: "Creación de procesos y estructura de RR. HH. desde cero", price: "€2.500–6.000/proyecto", icon: "🏗️" },
  { id: "onboarding-design", name: "Onboarding Design", desc: "Diseño e implementación de programas de onboarding", price: "€1.500–3.500/proyecto", icon: "🚀" },
  { id: "people-processes", name: "People Processes", desc: "Definición de OKRs, performance review y cultura", price: "€1.000–4.000/proyecto", icon: "⚙️" },
];

function fromRow(row: ConsultingLeadRow): ConsultingLead {
  return {
    id: row.id,
    company: row.company,
    sector: row.sector,
    size: row.size,
    contact: row.contact,
    need: row.need,
    status: row.status as ConsultingStatus,
    value: row.value,
    aiQualification: row.ai_qualification ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: Partial<CreateConsultingLeadInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.company !== undefined) row.company = input.company;
  if (input.sector !== undefined) row.sector = input.sector;
  if (input.size !== undefined) row.size = input.size;
  if (input.contact !== undefined) row.contact = input.contact;
  if (input.need !== undefined) row.need = input.need;
  if (input.status !== undefined) row.status = input.status;
  if (input.value !== undefined) row.value = input.value;
  return row;
}

export const consultingApi = {
  list: async (): Promise<PaginatedResult<ConsultingLead>> => {
    const { data, error } = await supabase.from("consulting_leads").select("*").order("created_at", { ascending: false }).limit(100);
    throwIfError(error);
    return paginate((data as ConsultingLeadRow[]).map(fromRow));
  },

  create: async (input: CreateConsultingLeadInput): Promise<ConsultingLead> => {
    const { data, error } = await supabase.from("consulting_leads").insert(toRow(input)).select("*").single();
    throwIfError(error);
    return fromRow(data as ConsultingLeadRow);
  },

  update: async (id: string, input: UpdateConsultingLeadInput): Promise<ConsultingLead> => {
    const { data, error } = await supabase.from("consulting_leads").update(toRow(input)).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as ConsultingLeadRow);
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("consulting_leads").delete().eq("id", id);
    throwIfError(error);
  },

  qualifyWithAi: async (id: string): Promise<ConsultingLead> => {
    const { data: current, error: fetchError } = await supabase.from("consulting_leads").select("*").eq("id", id).single();
    throwIfError(fetchError);
    const qualification = qualifyConsultingLead(fromRow(current as ConsultingLeadRow));
    const { data, error } = await supabase.from("consulting_leads").update({ ai_qualification: qualification }).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as ConsultingLeadRow);
  },

  services: async (): Promise<ConsultingService[]> => CONSULTING_SERVICES,
};
