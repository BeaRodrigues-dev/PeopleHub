import { supabase, throwIfError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import type { PaginatedResult } from "../../api/types";
import type { CreateHrDocumentMeta, HrDocument } from "./types";

interface DocumentRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

function fromRow(row: DocumentRow): HrDocument {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description ?? undefined,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileType: row.file_type,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

export const docsApi = {
  list: async (): Promise<PaginatedResult<HrDocument>> => {
    const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(100);
    throwIfError(error);
    return paginate((data as DocumentRow[]).map(fromRow));
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    throwIfError(error);
  },

  upload: async (file: File, meta: CreateHrDocumentMeta): Promise<HrDocument> => {
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    throwIfError(uploadError);
    const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(path);

    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("documents")
      .insert({
        title: meta.title,
        category: meta.category,
        description: meta.description,
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        uploaded_by: sessionData.session?.user.email ?? "",
      })
      .select("*")
      .single();
    throwIfError(error);
    return fromRow(data as DocumentRow);
  },
};
