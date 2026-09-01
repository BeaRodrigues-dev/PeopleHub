import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customKpiApi, customNoteApi, customTaskApi } from "./api";
import type { CreateCustomKpiInput, CreateCustomNoteInput, CreateCustomTaskInput } from "./types";

export const workspaceKeys = {
  kpis: ["custom-kpis"] as const,
  tasks: ["custom-tasks"] as const,
  notes: ["custom-notes"] as const,
};

export function useCustomKpis() {
  return useQuery({ queryKey: workspaceKeys.kpis, queryFn: () => customKpiApi.list() });
}

export function useCreateCustomKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomKpiInput) => customKpiApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.kpis }),
  });
}

export function useUpdateCustomKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateCustomKpiInput> }) => customKpiApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.kpis }),
  });
}

export function useDeleteCustomKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customKpiApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.kpis }),
  });
}

export function useCustomTasks() {
  return useQuery({ queryKey: workspaceKeys.tasks, queryFn: () => customTaskApi.list() });
}

export function useCreateCustomTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomTaskInput) => customTaskApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks }),
  });
}

export function useToggleCustomTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => customTaskApi.toggle(id, done),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks }),
  });
}

export function useDeleteCustomTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customTaskApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks }),
  });
}

export function useCustomNotes() {
  return useQuery({ queryKey: workspaceKeys.notes, queryFn: () => customNoteApi.list() });
}

export function useCreateCustomNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomNoteInput) => customNoteApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.notes }),
  });
}

export function useUpdateCustomNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateCustomNoteInput> }) => customNoteApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.notes }),
  });
}

export function useDeleteCustomNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customNoteApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.notes }),
  });
}
