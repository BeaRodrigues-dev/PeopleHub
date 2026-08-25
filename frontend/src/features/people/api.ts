import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from "./types";

export interface EmployeeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  lifecycle?: string;
}

export const peopleApi = {
  list: (params: EmployeeQueryParams = {}) =>
    httpClient.get<PaginatedResult<Employee>>("employees", { page: params.page ?? 1, limit: params.limit ?? 100, search: params.search, lifecycle: params.lifecycle }),
  getById: (id: string) => httpClient.get<Employee>(`employees/${id}`),
  create: (input: CreateEmployeeInput) => httpClient.post<Employee>("employees", input),
  update: (id: string, input: UpdateEmployeeInput) => httpClient.patch<Employee>(`employees/${id}`, input),
  remove: (id: string) => httpClient.delete<void>(`employees/${id}`),
};
