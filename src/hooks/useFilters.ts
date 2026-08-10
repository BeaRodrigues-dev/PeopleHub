import { useCallback } from "react";
import { defaultFilters, useCandidateStore } from "../store/candidateStore";
import type { Filters } from "../types/candidate";
export const useFilters = () => {
  const filters = useCandidateStore((s) => s.filters);
  const set = useCandidateStore((s) => s.setFilters);
  const resetBoard = useCandidateStore((s) => s.resetBoard);
  const update = useCallback(
    (next: Filters) => {
      set(next);
      resetBoard();
    },
    [set, resetBoard],
  );
  return { filters, update, clear: () => update(defaultFilters) };
};
