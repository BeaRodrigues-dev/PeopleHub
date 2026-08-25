import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vacancyApi, type VacancyQueryParams } from "./api";
import type { CreateVacancyInput } from "./types";

export const vacancyKeys = {
  all: ["vacancies"] as const,
  lists: () => [...vacancyKeys.all, "list"] as const,
  list: (params: VacancyQueryParams) => [...vacancyKeys.lists(), params] as const,
  detail: (id?: string | null) => [...vacancyKeys.all, "detail", id] as const,
};

export function useVacancies(params: VacancyQueryParams = {}) {
  return useQuery({ queryKey: vacancyKeys.list(params), queryFn: () => vacancyApi.list(params) });
}

export function useVacancy(id?: string | null) {
  return useQuery({ queryKey: vacancyKeys.detail(id), queryFn: () => vacancyApi.getById(id!), enabled: !!id });
}

export function useTimeToFill(id?: string | null) {
  return useQuery({
    queryKey: [...vacancyKeys.detail(id), "time-to-fill"],
    queryFn: () => vacancyApi.timeToFill(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVacancy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVacancyInput) => vacancyApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vacancyKeys.all }),
  });
}
