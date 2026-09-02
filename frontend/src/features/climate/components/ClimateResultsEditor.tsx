import { useState } from "react";
import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useCreateClimateResult, useDeleteClimateResult, useUpdateClimateResult } from "../queries";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { CLIMATE_SCORE_MAX, type ClimateSurveyResult } from "../types";

const BAR_COLORS = ["#6C5CE0", "#4C7DE0", "#2FA36B", "#E08A3C", "#5646C4", "#9B8FEA", "#D6A65D"];

/**
 * Editor de los puntajes por categoría de una ronda — pensado como tarjetas
 * de análisis (no como planilla): una fila por dimensión de clima, con barra
 * comparativa, puntaje editable y comentario opcional. Las categorías de la
 * ronda aparecen siempre, aunque todavía no tengan puntaje cargado.
 */
export function ClimateResultsEditor({ roundId, categories, results }: { roundId: string; categories: string[]; results: ClimateSurveyResult[] }) {
  const [customCategory, setCustomCategory] = useState("");
  const createResult = useCreateClimateResult();
  const updateResult = useUpdateClimateResult();
  const deleteResult = useDeleteClimateResult();
  const toast = useToast();

  const byCategory = new Map(results.map((r) => [r.category, r]));
  const extraCategories = results.map((r) => r.category).filter((c) => !categories.includes(c));
  const orderedCategories = [...categories, ...Array.from(new Set(extraCategories))];

  const average = results.length ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;

  const handleRate = (category: string, score: number) => {
    const existing = byCategory.get(category);
    if (existing) {
      updateResult.mutate({ id: existing.id, input: { score } }, { onError: (err) => toast.error(errorMessage(err, "No se pudo actualizar.")) });
    } else {
      createResult.mutate({ roundId, category, score }, { onError: (err) => toast.error(errorMessage(err, "No fue posible cargar el puntaje.")) });
    }
  };

  const handleCommentChange = (result: ClimateSurveyResult, comment: string) => {
    updateResult.mutate({ id: result.id, input: { comment } }, { onError: (err) => toast.error(errorMessage(err, "No se pudo actualizar.")) });
  };

  const handleAddCustom = () => {
    const value = customCategory.trim();
    if (!value) return;
    createResult.mutate(
      { roundId, category: value, score: CLIMATE_SCORE_MAX * 0.7 },
      {
        onSuccess: () => setCustomCategory(""),
        onError: (err) => toast.error(errorMessage(err, "No fue posible agregar la categoría.")),
      },
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" fontWeight={700}>Resultados por categoría</Typography>
        <Typography variant="body2" color="text.secondary">Promedio: <Typography component="span" fontWeight={800} color="primary.dark">{average.toFixed(1)}</Typography> / {CLIMATE_SCORE_MAX}</Typography>
      </Stack>

      <Stack spacing={1.25}>
        {orderedCategories.map((category, i) => {
          const result = byCategory.get(category);
          const score = result?.score ?? 0;
          return (
            <Box key={category} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 1.75 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="body2" fontWeight={700} sx={{ width: { xs: 120, sm: 190 }, flexShrink: 0 }} noWrap>{category}</Typography>
                <Box sx={{ flex: 1, height: 10, bgcolor: "#EFEDFB", borderRadius: 2, overflow: "hidden" }}>
                  {result && <Box sx={{ width: `${Math.min(100, (score / CLIMATE_SCORE_MAX) * 100)}%`, height: "100%", bgcolor: BAR_COLORS[i % BAR_COLORS.length] }} />}
                </Box>
                <TextField
                  type="number"
                  size="small"
                  value={result ? score : ""}
                  placeholder="—"
                  onChange={(e) => handleRate(category, Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 0, max: CLIMATE_SCORE_MAX, step: 0.5 } }}
                  sx={{ width: 72, flexShrink: 0 }}
                />
                {result && (
                  <IconButton size="small" onClick={() => deleteResult.mutate(result.id)}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              {result ? (
                <TextField
                  size="small"
                  variant="standard"
                  fullWidth
                  placeholder="Comentario (opcional)…"
                  defaultValue={result.comment}
                  onBlur={(e) => e.target.value !== result.comment && handleCommentChange(result, e.target.value)}
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary" fontStyle="italic" sx={{ display: "block", mt: 0.5 }}>Todavía sin calificar — carga un puntaje de 0 a {CLIMATE_SCORE_MAX}.</Typography>
              )}
            </Box>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Agregar otra dimensión (ej.: Diversidad e inclusión)…"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
        />
        <Button variant="outlined" startIcon={<AddRoundedIcon fontSize="small" />} onClick={handleAddCustom} sx={{ flexShrink: 0 }}>Agregar</Button>
      </Stack>
    </Stack>
  );
}
