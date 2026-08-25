import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { CreateInsightInput, Insight } from "./types";

export const insightsApi = {
  list: () => httpClient.get<PaginatedResult<Insight>>("insights", { limit: 100 }),
  create: (input: CreateInsightInput) => httpClient.post<Insight>("insights", input),
  remove: (id: string) => httpClient.delete<void>(`insights/${id}`),
  generateWithAi: () => httpClient.post<Insight[]>("ai/insights/generate"),
};
