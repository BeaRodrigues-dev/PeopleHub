import { useQuery } from "@tanstack/react-query";
import { candidateService } from "../services/candidate.service";
export const useCandidate = (id?: string) =>
  useQuery({
    queryKey: ["candidate", id],
    queryFn: () => candidateService.getCandidateById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
