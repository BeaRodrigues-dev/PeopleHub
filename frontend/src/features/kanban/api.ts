import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { Application, ApplicationStatus } from "./types";

export const applicationApi = {
  listAll: () => httpClient.get<PaginatedResult<Application>>("applications", { limit: 500 }),
  listByVacancy: (vacancyId: string) =>
    httpClient.get<PaginatedResult<Application>>("applications", { vacancyId, populate: "candidate", limit: 500 }),
  listByCandidate: (candidateId: string) =>
    httpClient.get<PaginatedResult<Application>>("applications", { candidateId, limit: 100 }),
  create: (input: { candidateId: string; vacancyId: string; currentStage?: string }) =>
    httpClient.post<Application>("applications", input),
  moveStage: (id: string, stage: string) => httpClient.patch<Application>(`applications/${id}/stage`, { stage }),
  updateStatus: (id: string, status: ApplicationStatus) => httpClient.patch<Application>(`applications/${id}/status`, { status }),
  evaluate: (id: string) => httpClient.post<Application>(`applications/${id}/evaluate`),
  remove: (id: string) => httpClient.delete<void>(`applications/${id}`),
};
