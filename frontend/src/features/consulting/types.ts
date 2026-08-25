export const CONSULTING_STATUSES = ["Pesquisado", "Proposta enviada", "Reunião agendada", "Em negociação", "Cliente"] as const;
export type ConsultingStatus = (typeof CONSULTING_STATUSES)[number];

export interface ConsultingLead {
  id: string;
  company: string;
  sector: string;
  size: string;
  contact: string;
  need: string;
  status: ConsultingStatus;
  value: string;
  aiQualification?: {
    priority: "Alta" | "Média" | "Baixa";
    reasoning: string;
    suggestedNextStep: string;
    evaluatedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateConsultingLeadInput = Omit<ConsultingLead, "id" | "createdAt" | "updatedAt" | "aiQualification">;
export type UpdateConsultingLeadInput = Partial<CreateConsultingLeadInput>;

export interface ConsultingService {
  id: string;
  name: string;
  desc: string;
  price: string;
  icon: string;
}
