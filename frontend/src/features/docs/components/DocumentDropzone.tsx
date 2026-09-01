import { useRef, useState, type DragEvent } from "react";
import { Box, Typography } from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc"];
const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

/** Zona de arrastrar y soltar nativa (sin librerías externas) para subir manuales/documentos en PDF/DOCX. */
export function DocumentDropzone({ onFile, disabled, fileName }: { onFile: (file: File) => void; disabled?: boolean; fileName?: string }) {
  const [isDragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): boolean => {
    if (!ACCEPTED_MIME.has(file.type) && !ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setFileError("Formato no compatible. Sube un archivo PDF o DOCX.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("Archivo demasiado grande (máximo 10MB).");
      return false;
    }
    setFileError(null);
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && validate(file)) onFile(file);
  };

  return (
    <Box>
      <Box
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e: DragEvent) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setDragging(false); if (!disabled) handleFiles(e.dataTransfer.files); }}
        sx={{
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          borderRadius: 4,
          bgcolor: isDragging ? "action.hover" : "#F3F1FC",
          p: 4,
          textAlign: "center",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color .15s ease, background .15s ease",
        }}
      >
        <UploadFileRoundedIcon sx={{ fontSize: 30, color: "primary.main", mb: 1 }} />
        <Typography fontWeight={750} fontSize={14}>{fileName || "Arrastra el documento aquí"}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>o haz clic para seleccionar — PDF o DOCX, hasta 10MB</Typography>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </Box>
      {fileError && <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>{fileError}</Typography>}
    </Box>
  );
}
