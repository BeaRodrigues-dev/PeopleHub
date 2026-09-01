import { useMemo, useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import { useDeleteDocument, useDocuments } from "../queries";
import { UploadDocumentModal } from "../components/UploadDocumentModal";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { DOCUMENT_CATEGORIES } from "../types";

export function DocsPage() {
  const { data, isLoading, isError, error, refetch } = useDocuments();
  const documents = data?.items ?? [];
  const [category, setCategory] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const deleteDocument = useDeleteDocument();

  const filtered = useMemo(() => (category ? documents.filter((d) => d.category === category) : documents), [documents, category]);

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 2.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Documentos</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Manuales, políticas y materiales de referencia del área de People.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setUploadOpen(true)}>Agregar documento</Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
        <Chip label="Todas" onClick={() => setCategory(null)} sx={{ fontWeight: 700, bgcolor: !category ? "primary.main" : "#E9E9F6", color: !category ? "#fff" : "text.secondary" }} />
        {DOCUMENT_CATEGORIES.map((c) => (
          <Chip key={c} label={c} onClick={() => setCategory(c)} sx={{ fontWeight: 700, bgcolor: category === c ? "primary.main" : "#E9E9F6", color: category === c ? "#fff" : "text.secondary" }} />
        ))}
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={120} />)}</Box>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<LibraryBooksRoundedIcon />} title="Todavía no hay documentos" description="Agrega manuales, políticas o guías del área de People." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setUploadOpen(true)}>Agregar documento</Button>} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
          {filtered.map((doc) => (
            <Box key={doc.id} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.25 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: "#E9E9F6", display: "grid", placeItems: "center", color: "primary.main" }}>
                  <DescriptionRoundedIcon fontSize="small" />
                </Box>
                <IconButton size="small" onClick={() => deleteDocument.mutate(doc.id)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
              </Stack>
              <Typography fontWeight={700} sx={{ mt: 1.25 }}>{doc.title}</Typography>
              {doc.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{doc.description}</Typography>}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                <Chip label={doc.category} size="small" sx={{ bgcolor: "#E9E9F6", color: "primary.main", fontWeight: 700 }} />
                <Typography
                  component="a"
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="caption"
                  color="primary.main"
                  fontWeight={700}
                  sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  Abrir →
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </Box>
  );
}
