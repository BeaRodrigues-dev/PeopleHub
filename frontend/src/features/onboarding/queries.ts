import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onboardingApi } from "./api";
import type { ChecklistPhase, CreateOnboardingInput } from "./types";

export const onboardingKeys = {
  all: ["onboardings"] as const,
  lists: () => [...onboardingKeys.all, "list"] as const,
};

export function useOnboardings() {
  return useQuery({ queryKey: onboardingKeys.lists(), queryFn: () => onboardingApi.list() });
}

export function useCreateOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOnboardingInput) => onboardingApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.all }),
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, phase, index }: { id: string; phase: ChecklistPhase; index: number }) => onboardingApi.toggleItem(id, phase, index),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.all }),
  });
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateOnboardingInput> }) => onboardingApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.all }),
  });
}

export function useDeleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => onboardingApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.all }),
  });
}
