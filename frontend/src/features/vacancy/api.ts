import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { CreateVacancyInput, TimeToFillPrediction, Vacancy, VacancyStatus } from "./types";

export interface VacancyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VacancyStatus;
}

export const vacancyApi = {
  list: (params: VacancyQueryParams = {}) =>
    httpClient.get<PaginatedResult<Vacancy>>("vacancies", { page: params.page ?? 1, limit: params.limit ?? 100, search: params.search, status: params.status }),
  getById: (id: string) => httpClient.get<Vacancy>(`vacancies/${id}`),
  create: (input: CreateVacancyInput) => httpClient.post<Vacancy>("vacancies", input),
  update: (id: string, input: Partial<CreateVacancyInput>) => httpClient.patch<Vacancy>(`vacancies/${id}`, input),
  remove: (id: string) => httpClient.delete<void>(`vacancies/${id}`),
  timeToFill: (id: string) => httpClient.get<TimeToFillPrediction>(`vacancies/${id}/time-to-fill`),
};
