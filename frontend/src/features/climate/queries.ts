import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { climateActionItemApi, climateResultApi, climateRoundApi, climateThemeNoteApi } from "./api";
import type {
  CreateClimateActionItemInput,
  CreateClimateSurveyResultInput,
  CreateClimateSurveyRoundInput,
  CreateClimateThemeNoteInput,
} from "./types";

export const climateKeys = {
  rounds: ["climate-rounds"] as const,
  results: ["climate-results"] as const,
  themeNotes: ["climate-theme-notes"] as const,
  actionItems: ["climate-action-items"] as const,
};

export function useClimateRounds() {
  return useQuery({ queryKey: climateKeys.rounds, queryFn: () => climateRoundApi.list() });
}

export function useCreateClimateRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClimateSurveyRoundInput) => climateRoundApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.rounds }),
  });
}

export function useUpdateClimateRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateClimateSurveyRoundInput> }) => climateRoundApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.rounds }),
  });
}

export function useDeleteClimateRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => climateRoundApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: climateKeys.rounds });
      queryClient.invalidateQueries({ queryKey: climateKeys.results });
      queryClient.invalidateQueries({ queryKey: climateKeys.themeNotes });
      queryClient.invalidateQueries({ queryKey: climateKeys.actionItems });
    },
  });
}

export function useClimateResults() {
  return useQuery({ queryKey: climateKeys.results, queryFn: () => climateResultApi.list() });
}

export function useCreateClimateResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClimateSurveyResultInput) => climateResultApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.results }),
  });
}

export function useUpdateClimateResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateClimateSurveyResultInput> }) => climateResultApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.results }),
  });
}

export function useDeleteClimateResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => climateResultApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.results }),
  });
}

export function useClimateThemeNotes() {
  return useQuery({ queryKey: climateKeys.themeNotes, queryFn: () => climateThemeNoteApi.list() });
}

export function useCreateClimateThemeNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClimateThemeNoteInput) => climateThemeNoteApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.themeNotes }),
  });
}

export function useUpdateClimateThemeNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateClimateThemeNoteInput> }) => climateThemeNoteApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.themeNotes }),
  });
}

export function useDeleteClimateThemeNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => climateThemeNoteApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.themeNotes }),
  });
}

export function useClimateActionItems() {
  return useQuery({ queryKey: climateKeys.actionItems, queryFn: () => climateActionItemApi.list() });
}

export function useCreateClimateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClimateActionItemInput) => climateActionItemApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.actionItems }),
  });
}

export function useUpdateClimateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateClimateActionItemInput> }) => climateActionItemApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.actionItems }),
  });
}

export function useDeleteClimateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => climateActionItemApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: climateKeys.actionItems }),
  });
}
