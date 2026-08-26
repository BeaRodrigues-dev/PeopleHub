import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { consultingApi } from "./api";
import type { CreateConsultingLeadInput, UpdateConsultingLeadInput } from "./types";

export const consultingKeys = {
  all: ["consulting-leads"] as const,
  lists: () => [...consultingKeys.all, "list"] as const,
  services: () => ["consulting-services"] as const,
};

export function useConsultingLeads() {
  return useQuery({ queryKey: consultingKeys.lists(), queryFn: () => consultingApi.list() });
}

export function useConsultingServices() {
  return useQuery({ queryKey: consultingKeys.services(), queryFn: () => consultingApi.services() });
}

export function useCreateConsultingLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConsultingLeadInput) => consultingApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consultingKeys.all }),
  });
}

export function useUpdateConsultingLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateConsultingLeadInput }) => consultingApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consultingKeys.all }),
  });
}

export function useDeleteConsultingLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consultingApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consultingKeys.all }),
  });
}

export function useQualifyLeadWithAi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consultingApi.qualifyWithAi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consultingKeys.all }),
  });
}
