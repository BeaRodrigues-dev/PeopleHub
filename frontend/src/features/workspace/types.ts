export const WORKSPACE_CATEGORIES = ["Empresa", "Personal"] as const;
export type WorkspaceCategory = (typeof WORKSPACE_CATEGORIES)[number];

export interface CustomKpi {
  id: string;
  label: string;
  value: number;
  unit: string;
  category: WorkspaceCategory;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomKpiInput {
  label: string;
  value: number;
  unit?: string;
  category: WorkspaceCategory;
  note?: string;
}

export interface CustomTask {
  id: string;
  text: string;
  done: boolean;
  category: WorkspaceCategory;
  createdAt: string;
}

export interface CreateCustomTaskInput {
  text: string;
  category: WorkspaceCategory;
}

export interface CustomNote {
  id: string;
  title: string;
  body: string;
  category: WorkspaceCategory;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomNoteInput {
  title: string;
  body: string;
  category: WorkspaceCategory;
}
