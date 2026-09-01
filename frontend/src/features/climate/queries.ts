import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { climateResultApi, climateRoundApi } from "./api";
import type { CreateClimateSurveyResultInput, CreateClimateSurveyRoundInput } from "./types";

export const climateKeys = {
  rounds: ["climate-rounds"] as const,
  results: ["climate-results"] as const,
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
