import { useCallback, useEffect, useRef } from "react";
import { candidateService } from "../services/candidate.service";
import { useCandidateStore } from "../store/candidateStore";
import type { Status } from "../types/candidate";

const LIMIT = 18;
export function useKanban(status: Status) {
  const search = useCandidateStore((s) => s.search),
    filters = useCandidateStore((s) => s.filters),
    column = useCandidateStore((s) => s.kanbanState[status]),
    cachePage = useCandidateStore((s) => s.cachePage);
  const pending = useRef(false);
  const load = useCallback(
    async (fresh = false) => {
      if (pending.current || (!fresh && column && !column.hasMore)) return;
      pending.current = true;
      const page = fresh ? 0 : (column?.page ?? -1) + 1;
      try {
        const result = await candidateService.getMoreCandidates({
          status,
          page,
          limit: LIMIT,
          query: search,
          filters,
        });
        cachePage(status, result.items, page, result.hasMore);
      } finally {
        pending.current = false;
      }
    },
    [status, column, search, filters, cachePage],
  );
  useEffect(() => {
    if (!column) void load(true);
  }, [column, load]);
  return {
    candidates: (column?.ids ?? [])
      .map((id) => useCandidateStore.getState().cached[id])
      .filter(Boolean),
    hasMore: column?.hasMore ?? true,
    loadMore: load,
  };
}
