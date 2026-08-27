import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationApi } from "./api";
import type { Application } from "./types";
import { candidateKeys } from "../candidate/queries";

export const applicationKeys = {
  all: ["applications"] as const,
  byVacancy: (vacancyId?: string | null) => [...applicationKeys.all, "vacancy", vacancyId] as const,
  byCandidate: (candidateId?: string | null) => [...applicationKeys.all, "candidate", candidateId] as const,
};

export function useAllApplications() {
  return useQuery({ queryKey: [...applicationKeys.all, "all"], queryFn: () => applicationApi.listAll() });
}

export function useVacancyApplications(vacancyId?: string | null) {
  return useQuery({
    queryKey: applicationKeys.byVacancy(vacancyId),
    queryFn: () => applicationApi.listByVacancy(vacancyId!),
    enabled: !!vacancyId,
  });
}

export function useCandidateApplications(candidateId?: string | null) {
  return useQuery({
    queryKey: applicationKeys.byCandidate(candidateId),
    queryFn: () => applicationApi.listByCandidate(candidateId!),
    enabled: !!candidateId,
  });
}

/** Mueve al candidato de etapa con actualización optimista de la columna del Kanban. */
export function useMoveApplicationStage(vacancyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, stage }: { applicationId: string; stage: string }) => applicationApi.moveStage(applicationId, stage),
    onMutate: async ({ applicationId, stage }) => {
      const key = applicationKeys.byVacancy(vacancyId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ items: Application[] }>(key);
      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          items: previous.items.map((app) => (app.id === applicationId ? { ...app, currentStage: stage } : app)),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(applicationKeys.byVacancy(vacancyId), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: applicationKeys.byVacancy(vacancyId) }),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { candidateId: string; vacancyId: string; currentStage?: string }) => applicationApi.create(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.byVacancy(variables.vacancyId) });
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
    },
  });
}

export function useEvaluateApplication(vacancyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => applicationApi.evaluate(applicationId),
    onSuccess: () => {
      if (vacancyId) queryClient.invalidateQueries({ queryKey: applicationKeys.byVacancy(vacancyId) });
    },
  });
}

export function useRemoveApplication(vacancyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => applicationApi.remove(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.byVacancy(vacancyId) });
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
    },
  });
}
