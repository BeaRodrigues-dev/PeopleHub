import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { ChecklistPhase, CreateOnboardingInput, OnboardingEntry } from "./types";

export const onboardingApi = {
  list: () => httpClient.get<PaginatedResult<OnboardingEntry>>("onboardings", { limit: 100 }),
  getById: (id: string) => httpClient.get<OnboardingEntry>(`onboardings/${id}`),
  create: (input: CreateOnboardingInput) => httpClient.post<OnboardingEntry>("onboardings", input),
  update: (id: string, input: Partial<CreateOnboardingInput>) => httpClient.patch<OnboardingEntry>(`onboardings/${id}`, input),
  toggleItem: (id: string, phase: ChecklistPhase, index: number) =>
    httpClient.patch<OnboardingEntry>(`onboardings/${id}/checklist`, { phase, index }),
  remove: (id: string) => httpClient.delete<void>(`onboardings/${id}`),
  suggestChecklist: (role: string) => httpClient.post<{ before: { label: string; done: boolean }[]; day1: { label: string; done: boolean }[]; week1: { label: string; done: boolean }[] }>("ai/onboarding-checklist", { role }),
};
