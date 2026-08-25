import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insightsApi } from "./api";
import type { CreateInsightInput } from "./types";

export const insightKeys = {
  all: ["insights"] as const,
  lists: () => [...insightKeys.all, "list"] as const,
};

export function useInsights() {
  return useQuery({ queryKey: insightKeys.lists(), queryFn: () => insightsApi.list() });
}

export function useCreateInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInsightInput) => insightsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: insightKeys.all }),
  });
}

export function useDeleteInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => insightsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: insightKeys.all }),
  });
}

export function useGenerateInsightsWithAi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => insightsApi.generateWithAi(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: insightKeys.all }),
  });
}
