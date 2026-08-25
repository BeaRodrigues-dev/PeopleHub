import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { peopleApi, type EmployeeQueryParams } from "./api";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "./types";

export const peopleKeys = {
  all: ["employees"] as const,
  lists: () => [...peopleKeys.all, "list"] as const,
  list: (params: EmployeeQueryParams) => [...peopleKeys.lists(), params] as const,
  detail: (id?: string | null) => [...peopleKeys.all, "detail", id] as const,
};

export function useEmployees(params: EmployeeQueryParams = {}) {
  return useQuery({ queryKey: peopleKeys.list(params), queryFn: () => peopleApi.list(params) });
}

export function useEmployee(id?: string | null) {
  return useQuery({ queryKey: peopleKeys.detail(id), queryFn: () => peopleApi.getById(id!), enabled: !!id });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => peopleApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: peopleKeys.all }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeInput }) => peopleApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: peopleKeys.all }),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => peopleApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: peopleKeys.all }),
  });
}
