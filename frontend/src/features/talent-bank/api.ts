import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { CandidateQueryParams } from "../candidate/api";
import type { Candidate } from "../candidate/types";
import type { TalentBankMatch } from "./types";

export const talentBankApi = {
  list: (params: CandidateQueryParams = {}) =>
    httpClient.get<PaginatedResult<Candidate>>("talent-bank", {
      page: params.page ?? 1,
      limit: params.limit ?? 24,
      search: params.search,
      skills: params.skills,
      locations: params.locations,
    }),
  match: (vacancyId: string) => httpClient.get<TalentBankMatch[]>(`talent-bank/match/${vacancyId}`),
  matchWithAi: (vacancyId: string) => httpClient.post<TalentBankMatch[]>(`talent-bank/match/${vacancyId}/ai`),
  assign: (candidateIds: string[], vacancyId: string) =>
    httpClient.post("talent-bank/assign", { candidateIds, vacancyId }),
};
