export const DOCUMENT_CATEGORIES = ["Políticas", "Beneficios", "Onboarding", "Cultura", "Cumplimiento", "Otro"] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface HrDocument {
  id: string;
  title: string;
  category: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface CreateHrDocumentMeta {
  title: string;
  category: string;
  description?: string;
}
