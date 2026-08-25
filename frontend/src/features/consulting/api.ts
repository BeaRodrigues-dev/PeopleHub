import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { ConsultingLead, ConsultingService, CreateConsultingLeadInput, UpdateConsultingLeadInput } from "./types";

export const consultingApi = {
  list: () => httpClient.get<PaginatedResult<ConsultingLead>>("consulting-leads", { limit: 100 }),
  create: (input: CreateConsultingLeadInput) => httpClient.post<ConsultingLead>("consulting-leads", input),
  update: (id: string, input: UpdateConsultingLeadInput) => httpClient.patch<ConsultingLead>(`consulting-leads/${id}`, input),
  remove: (id: string) => httpClient.delete<void>(`consulting-leads/${id}`),
  qualifyWithAi: (id: string) => httpClient.post<ConsultingLead>(`consulting-leads/${id}/qualify`),
  services: () => httpClient.get<ConsultingService[]>("consulting-leads/services"),
};
