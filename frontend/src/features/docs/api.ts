import { httpClient } from "../../api/httpClient";
import type { PaginatedResult } from "../../api/types";
import type { CreateHrDocumentMeta, HrDocument } from "./types";

export const docsApi = {
  list: () => httpClient.get<PaginatedResult<HrDocument>>("documents", { limit: 100 }),
  remove: (id: string) => httpClient.delete<void>(`documents/${id}`),
  upload: (file: File, meta: CreateHrDocumentMeta) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", meta.title);
    formData.append("category", meta.category);
    if (meta.description) formData.append("description", meta.description);
    return fetch(`${(import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001/api/v1"}/documents`.replace(/\/$/, ""), {
      method: "POST",
      body: formData,
    }).then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.message || "Falha ao enviar documento");
      }
      return r.json() as Promise<HrDocument>;
    });
  },
};
