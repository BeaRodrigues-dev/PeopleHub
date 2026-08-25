import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { talentBankApi } from "./api";
import type { CandidateQueryParams } from "../candidate/api";
import { candidateKeys } from "../candidate/queries";
import { applicationKeys } from "../kanban/queries";

export const talentBankKeys = {
  all: ["talent-bank"] as const,
  list: (params: CandidateQueryParams) => [...talentBankKeys.all, "list", params] as const,
  match: (vacancyId?: string | null) => [...talentBankKeys.all, "match", vacancyId] as const,
};

export function useTalentPool(params: CandidateQueryParams) {
  return useQuery({ queryKey: talentBankKeys.list(params), queryFn: () => talentBankApi.list(params) });
}

export function useTalentBankMatch(vacancyId?: string | null) {
  return useQuery({
    queryKey: talentBankKeys.match(vacancyId),
    queryFn: () => talentBankApi.match(vacancyId!),
    enabled: !!vacancyId,
  });
}

export function useTalentBankMatchWithAi() {
  return useMutation({ mutationFn: (vacancyId: string) => talentBankApi.matchWithAi(vacancyId) });
}

export function useAssignFromTalentBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateIds, vacancyId }: { candidateIds: string[]; vacancyId: string }) =>
      talentBankApi.assign(candidateIds, vacancyId),
    onSuccess: (_data, { vacancyId }) => {
      queryClient.invalidateQueries({ queryKey: talentBankKeys.all });
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.byVacancy(vacancyId) });
    },
  });
}
