import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agendaApi } from "./api";
import type { CreateAgendaEventInput } from "./types";

export const agendaKeys = {
  events: ["agenda-events"] as const,
};

export function useAgendaEvents() {
  return useQuery({ queryKey: agendaKeys.events, queryFn: () => agendaApi.list() });
}

export function useCreateAgendaEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgendaEventInput) => agendaApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: agendaKeys.events }),
  });
}

export function useUpdateAgendaEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateAgendaEventInput> }) => agendaApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: agendaKeys.events }),
  });
}

export function useDeleteAgendaEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: agendaKeys.events }),
  });
}
