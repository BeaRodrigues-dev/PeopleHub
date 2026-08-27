import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateApi, type CandidateQueryParams } from "./api";
import type { CreateCandidateInput, UpdateCandidateInput } from "./types";

export const candidateKeys = {
  all: ["candidates"] as const,
  lists: () => [...candidateKeys.all, "list"] as const,
  list: (params: CandidateQueryParams) => [...candidateKeys.lists(), params] as const,
  detail: (id?: string | null) => [...candidateKeys.all, "detail", id] as const,
  counts: (vacancyIds: string[]) => [...candidateKeys.all, "counts", vacancyIds] as const,
};

export function useCandidates(params: CandidateQueryParams) {
  return useQuery({
    queryKey: candidateKeys.list(params),
    queryFn: () => candidateApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCandidate(id?: string | null) {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: () => candidateApi.getById(id!),
    enabled: !!id,
  });
}

export function useVacancyCandidateCounts(vacancyIds: string[]) {
  return useQuery({
    queryKey: candidateKeys.counts(vacancyIds),
    queryFn: () => candidateApi.countsByVacancy(vacancyIds),
    enabled: vacancyIds.length > 0,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateCandidateInput>) => candidateApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: candidateKeys.all }),
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCandidateInput }) => candidateApi.update(id, input),
    // Optimistic update: aplica el cambio en el caché antes de la respuesta del servidor.
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: candidateKeys.detail(id) });
      const previous = queryClient.getQueryData(candidateKeys.detail(id));
      queryClient.setQueryData(candidateKeys.detail(id), (old: any) => (old ? { ...old, ...input } : old));
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(candidateKeys.detail(id), context.previous);
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => candidateApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: candidateKeys.all }),
  });
}

export function useParseResume() {
  return useMutation({ mutationFn: (file: File) => candidateApi.parseResume(file) });
}
