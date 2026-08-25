export const INSIGHT_TYPES = ["problem", "opportunity", "suggestion"] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];

export interface Insight {
  id: string;
  type: InsightType;
  text: string;
  area?: string;
  source: "manual" | "ai";
  date: string;
  createdAt: string;
}

export interface CreateInsightInput {
  type: InsightType;
  text: string;
  area?: string;
}
