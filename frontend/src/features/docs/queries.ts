import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { docsApi } from "./api";
import type { CreateHrDocumentMeta } from "./types";

export const docsKeys = {
  all: ["documents"] as const,
  lists: () => [...docsKeys.all, "list"] as const,
};

export function useDocuments() {
  return useQuery({ queryKey: docsKeys.lists(), queryFn: () => docsApi.list() });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: CreateHrDocumentMeta }) => docsApi.upload(file, meta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: docsKeys.all }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => docsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: docsKeys.all }),
  });
}
