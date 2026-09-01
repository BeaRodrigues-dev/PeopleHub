import { useState } from "react";
import { Box, Button, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useCreateClimateResult, useDeleteClimateResult, useUpdateClimateResult } from "../queries";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { CLIMATE_SCORE_MAX, type ClimateSurveyResult } from "../types";

const BAR_COLORS = ["#6C5CE0", "#E4DFFB", "#C7BBF5", "#9B8FEA", "#5646C4", "#6C5CE0", "#D6A65D"];

/** Editor de los puntajes por categoría de una ronda: agregar, editar y eliminar filas, más un gráfico de barras generado a partir de los datos. */
export function ClimateResultsEditor({ roundId, results }: { roundId: string; results: ClimateSurveyResult[] }) {
  const [draftCategory, setDraftCategory] = useState("");
  const [draftScore, setDraftScore] = useState(CLIMATE_SCORE_MAX);
  const createResult = useCreateClimateResult();
  const updateResult = useUpdateClimateResult();
  const deleteResult = useDeleteClimateResult();
  const toast = useToast();

  const handleAdd = () => {
    if (!draftCategory.trim()) return;
    createResult.mutate(
      { roundId, category: draftCategory.trim(), score: draftScore },
      {
        onSuccess: () => { setDraftCategory(""); setDraftScore(CLIMATE_SCORE_MAX); },
        onError: (err) => toast.error(errorMessage(err, "No fue posible agregar la categoría.")),
      },
    );
  };

  const handleScoreChange = (result: ClimateSurveyResult, score: number) => {
    updateResult.mutate({ id: result.id, input: { score } }, { onError: (err) => toast.error(errorMessage(err, "No se pudo actualizar.")) });
  };

  const handleCommentChange = (result: ClimateSurveyResult, comment: string) => {
    updateResult.mutate({ id: result.id, input: { comment } }, { onError: (err) => toast.error(errorMessage(err, "No se pudo actualizar.")) });
  };

  const average = results.length ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" fontWeight={700}>Resultados por categoría</Typography>
        <Typography variant="body2" color="text.secondary">Promedio: <Typography component="span" fontWeight={800} color="primary.dark">{average.toFixed(1)}</Typography> / {CLIMATE_SCORE_MAX}</Typography>
      </Stack>

      {results.length === 0 ? (
        <Typography variant="caption" color="text.secondary" fontStyle="italic">Todavía no hay categorías cargadas para esta ronda.</Typography>
      ) : (
        <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2 }}>
          <Stack spacing={1.25}>
            {results.map((r, i) => (
              <Stack key={r.id} direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 150, flexShrink: 0 }} noWrap>{r.category}</Typography>
                <Box sx={{ flex: 1, height: 18, bgcolor: "#EFEDFB", borderRadius: 2, overflow: "hidden" }}>
                  <Box sx={{ width: `${Math.min(100, (r.score / CLIMATE_SCORE_MAX) * 100)}%`, height: "100%", bgcolor: BAR_COLORS[i % BAR_COLORS.length] }} />
                </Box>
                <Typography variant="caption" fontWeight={700} sx={{ width: 30, textAlign: "right", flexShrink: 0 }}>{r.score}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#F3F1FC" }}>
              {["Categoría", `Puntaje (0–${CLIMATE_SCORE_MAX})`, "Comentario", ""].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell><Typography variant="body2" fontWeight={700}>{r.category}</Typography></TableCell>
                <TableCell sx={{ width: 130 }}>
                  <TextField
                    type="number"
                    size="small"
                    variant="standard"
                    value={r.score}
                    onChange={(e) => handleScoreChange(r, Number(e.target.value))}
                    slotProps={{ htmlInput: { min: 0, max: CLIMATE_SCORE_MAX, step: 0.5 } }}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    fullWidth
                    placeholder="Opcional…"
                    defaultValue={r.comment}
                    onBlur={(e) => e.target.value !== r.comment && handleCommentChange(r, e.target.value)}
                  />
                </TableCell>
                <TableCell sx={{ width: 40 }}>
                  <IconButton size="small" onClick={() => deleteResult.mutate(r.id)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <TextField
                  size="small"
                  variant="standard"
                  fullWidth
                  placeholder="Nueva categoría (ej.: Liderazgo)…"
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                />
              </TableCell>
              <TableCell sx={{ width: 130 }}>
                <TextField
                  type="number"
                  size="small"
                  variant="standard"
                  value={draftScore}
                  onChange={(e) => setDraftScore(Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 0, max: CLIMATE_SCORE_MAX, step: 0.5 } }}
                  sx={{ width: 70 }}
                />
              </TableCell>
              <TableCell colSpan={2}>
                <Button size="small" variant="outlined" startIcon={<AddRoundedIcon fontSize="small" />} onClick={handleAdd}>Agregar categoría</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}
