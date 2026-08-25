import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { Candidate, CreateCandidateInput, ResumeParseResult, UpdateCandidateInput } from "./types";

export interface CandidateQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vacancyId?: string;
  talentPoolOnly?: boolean;
  skills?: string[];
  locations?: string[];
}

/** Chamadas cruas à API — reaproveitadas pelos hooks de React Query abaixo e por outras features (ex.: talent-bank). */
export const candidateApi = {
  list: (params: CandidateQueryParams = {}) =>
    httpClient.get<PaginatedResult<Candidate>>("candidates", {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      vacancyId: params.vacancyId,
      talentPoolOnly: params.talentPoolOnly,
      skills: params.skills,
      locations: params.locations,
    }),
  getById: (id: string) => httpClient.get<Candidate>(`candidates/${id}`),
  create: (input: Partial<CreateCandidateInput>) => httpClient.post<Candidate>("candidates", input),
  update: (id: string, input: UpdateCandidateInput) => httpClient.patch<Candidate>(`candidates/${id}`, input),
  remove: (id: string) => httpClient.delete<void>(`candidates/${id}`),
  countsByVacancy: (vacancyIds: string[]) =>
    httpClient.get<Record<string, number>>("candidates/counts-by-vacancy", { ids: vacancyIds.join(",") }),
  parseResume: (file: File) => httpClient.upload<ResumeParseResult>("candidates/resume/parse", file),
};
