import { create } from "zustand";
import type { CandidateFilters } from "../features/candidate/types";

export const defaultFilters: CandidateFilters = { locations: [], skills: [] };

// Estado de UI puramente client-side (nada de dados de negócio — esses vêm
// do React Query). 100% em memória, perdido ao recarregar.
interface UIState {
  filters: CandidateFilters;
  filtersOpen: boolean;
  selectedCandidateId: string | null;
  editingCandidateId: string | null;
  matchModalVacancyId: string | null;
  addCandidateVacancyId: string | null | undefined; // undefined = modal fechado; null = sem vaga pré-selecionada

  setFilters: (filters: CandidateFilters) => void;
  clearFilters: () => void;
  openFilters: () => void;
  closeFilters: () => void;
  openCandidate: (id: string) => void;
  closeCandidate: () => void;
  openEdit: (id: string) => void;
  closeEdit: () => void;
  openMatchModal: (vacancyId: string) => void;
  closeMatchModal: () => void;
  openAddCandidate: (vacancyId?: string | null) => void;
  closeAddCandidate: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  filters: defaultFilters,
  filtersOpen: false,
  selectedCandidateId: null,
  editingCandidateId: null,
  matchModalVacancyId: null,
  addCandidateVacancyId: undefined,

  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: defaultFilters }),
  openFilters: () => set({ filtersOpen: true }),
  closeFilters: () => set({ filtersOpen: false }),
  openCandidate: (selectedCandidateId) => set({ selectedCandidateId }),
  closeCandidate: () => set({ selectedCandidateId: null }),
  openEdit: (editingCandidateId) => set({ editingCandidateId }),
  closeEdit: () => set({ editingCandidateId: null }),
  openMatchModal: (matchModalVacancyId) => set({ matchModalVacancyId }),
  closeMatchModal: () => set({ matchModalVacancyId: null }),
  openAddCandidate: (vacancyId = null) => set({ addCandidateVacancyId: vacancyId }),
  closeAddCandidate: () => set({ addCandidateVacancyId: undefined }),
}));
