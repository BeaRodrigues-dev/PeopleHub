import { useState } from "react";
import { Button, MenuItem, Stack, TextField } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useUploadDocument } from "../queries";
import { DocumentDropzone } from "./DocumentDropzone";
import { DOCUMENT_CATEGORIES } from "../types";

export function UploadDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const upload = useUploadDocument();
  const toast = useToast();

  const reset = () => {
    setFile(null);
    setTitle("");
    setCategory(DOCUMENT_CATEGORIES[0]);
    setDescription("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f: File) => {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = () => {
    if (!file) { toast.error("Selecione um arquivo."); return; }
    if (!title.trim()) { toast.error("Informe um título."); return; }
    upload.mutate(
      { file, meta: { title, category, description: description || undefined } },
      {
        onSuccess: () => { toast.success("Documento adicionado."); handleClose(); },
        onError: (error) => toast.error(errorMessage(error, "Não foi possível enviar o documento.")),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Adicionar documento"
      subtitle="Manuais, políticas e materiais de referência da área."
      width={560}
      footer={
        <>
          <Button variant="text" onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={upload.isPending}>{upload.isPending ? "Enviando…" : "Adicionar"}</Button>
        </>
      }
    >
      <Stack spacing={2}>
        <DocumentDropzone onFile={handleFile} disabled={upload.isPending} fileName={file?.name} />
        <TextField label="Título" fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField select label="Categoria" fullWidth size="small" value={category} onChange={(e) => setCategory(e.target.value)}>
          {DOCUMENT_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField label="Descrição (opcional)" fullWidth size="small" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Stack>
    </Modal>
  );
}
