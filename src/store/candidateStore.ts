import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Candidate, Filters, Status, ViewMode } from "../types/candidate";

export const defaultFilters: Filters = {
  statuses: [],
  seniorities: [],
  locations: [],
  salary: [0, 30000],
  appliedFrom: "",
};
type ColumnState = {
  ids: string[];
  page: number;
  hasMore: boolean;
  scrollTop: number;
};
type Store = {
  viewMode: ViewMode;
  search: string;
  filters: Filters;
  selectedCandidate: string | null;
  kanbanState: Partial<Record<Status, ColumnState>>;
  cached: Record<string, Candidate>;
  setViewMode: (v: ViewMode) => void;
  setSearch: (s: string) => void;
  setFilters: (f: Filters) => void;
  selectCandidate: (id: string | null) => void;
  cachePage: (
    status: Status,
    candidates: Candidate[],
    page: number,
    hasMore: boolean,
  ) => void;
  setColumnScroll: (status: Status, top: number) => void;
  moveCandidate: (id: string, from: Status, to: Status, beforeId?: string) => void;
  resetBoard: () => void;
};
export const useCandidateStore = create<Store>()(
  persist(
    (set) => ({
      viewMode: "kanban",
      search: "",
      filters: defaultFilters,
      selectedCandidate: null,
      kanbanState: {},
      cached: {},
      setViewMode: (viewMode) => set({ viewMode }),
      setSearch: (search) => set({ search }),
      setFilters: (filters) => set({ filters }),
      selectCandidate: (selectedCandidate) => set({ selectedCandidate }),
      cachePage: (status, candidates, page, hasMore) =>
        set((state) => {
          const previous = state.kanbanState[status]?.ids ?? [];
          const ids =
            page === 0
              ? candidates.map((c) => c.id)
              : [...new Set([...previous, ...candidates.map((c) => c.id)])];
          return {
            cached: {
              ...state.cached,
              ...Object.fromEntries(candidates.map((c) => [c.id, c])),
            },
            kanbanState: {
              ...state.kanbanState,
              [status]: {
                ids,
                page,
                hasMore,
                scrollTop: state.kanbanState[status]?.scrollTop ?? 0,
              },
            },
          };
        }),
      setColumnScroll: (status, scrollTop) =>
        set((state) => ({
          kanbanState: {
            ...state.kanbanState,
            [status]: {
              ids: state.kanbanState[status]?.ids ?? [],
              page: state.kanbanState[status]?.page ?? 0,
              hasMore: state.kanbanState[status]?.hasMore ?? true,
              scrollTop,
            },
          },
        })),
      moveCandidate: (id, from, to, beforeId) =>
        set((state) => {
          const candidate = state.cached[id];
          if (!candidate) return state;
          const source = state.kanbanState[from] ?? {
            ids: [],
            page: 0,
            hasMore: true,
            scrollTop: 0,
          };
          const target = state.kanbanState[to] ?? {
            ids: [],
            page: 0,
            hasMore: true,
            scrollTop: 0,
          };
          const targetIds = target.ids.filter((candidateId) => candidateId !== id);
          const insertAt = beforeId ? Math.max(0, targetIds.indexOf(beforeId)) : targetIds.length;
          targetIds.splice(insertAt, 0, id);
          return {
            cached: {
              ...state.cached,
              [id]: { ...candidate, status: to, updatedAt: new Date().toISOString() },
            },
            kanbanState: {
              ...state.kanbanState,
              [from]: { ...source, ids: source.ids.filter((x) => x !== id) },
              [to]: { ...target, ids: targetIds },
            },
          };
        }),
      resetBoard: () => set({ kanbanState: {}, cached: {} }),
    }),
    {
      name: "candidate-flow-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        viewMode: s.viewMode,
        search: s.search,
        filters: s.filters,
        selectedCandidate: s.selectedCandidate,
        kanbanState: s.kanbanState,
        cached: s.cached,
      }),
    },
  ),
);
