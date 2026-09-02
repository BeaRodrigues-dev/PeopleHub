import { useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Grid, MenuItem, TextField, Typography } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateClimateRound, useUpdateClimateRound } from "../queries";
import { AUDIENCES, CLIMATE_CATEGORIES, ROUND_STATUSES, type ClimateSurveyRound, type CreateClimateSurveyRoundInput } from "../types";

const empty: CreateClimateSurveyRoundInput = {
  name: "",
  roundDate: new Date().toISOString().slice(0, 10),
  respondents: 0,
  notes: "",
  status: "Activa",
  startDate: "",
  endDate: "",
  audience: "Toda la empresa",
  audienceTeam: "",
  categories: [...CLIMATE_CATEGORIES],
  enps: null,
  targetHeadcount: null,
};

export function AddRoundModal({ open, onClose, round }: { open: boolean; onClose: () => void; round?: ClimateSurveyRound | null }) {
  const isEditing = !!round;
  const [form, setForm] = useState<CreateClimateSurveyRoundInput>(empty);
  const createRound = useCreateClimateRound();
  const updateRound = useUpdateClimateRound();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(
        round
          ? {
              name: round.name,
              roundDate: round.roundDate,
              respondents: round.respondents,
              notes: round.notes,
              status: round.status,
              startDate: round.startDate ?? "",
              endDate: round.endDate ?? "",
              audience: round.audience,
              audienceTeam: round.audienceTeam,
              categories: round.categories.length ? round.categories : [...CLIMATE_CATEGORIES],
              enps: round.enps,
              targetHeadcount: round.targetHeadcount,
            }
          : empty,
      );
    }
  }, [open, round]);

  const isSaving = createRound.isPending || updateRound.isPending;
  const set = <K extends keyof CreateClimateSurveyRoundInput>(key: K, value: CreateClimateSurveyRoundInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handleClose = () => { setForm(empty); onClose(); };

  const toggleCategory = (category: string) => {
    setForm((f) => {
      const current = f.categories ?? [];
      const has = current.includes(category);
      return { ...f, categories: has ? current.filter((c) => c !== category) : [...current, category] };
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Ingresa un nombre para la ronda.");
      return;
    }
    if (isEditing && round) {
      updateRound.mutate(
        { id: round.id, input: form },
        {
          onSuccess: () => { toast.success("Ronda actualizada."); handleClose(); },
          onError: (error) => toast.error(errorMessage(error, "No se pudieron guardar los cambios.")),
        },
      );
      return;
    }
    createRound.mutate(form, {
      onSuccess: () => { toast.success("Ronda creada."); handleClose(); },
      onError: (error) => toast.error(errorMessage(error, "No fue posible crear la ronda.")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar ronda" : "Nueva ronda de encuesta"}
      subtitle={isEditing ? undefined : "Cada ronda agrupa los resultados de una encuesta de clima — su estado, período y público objetivo."}
      width={560}
      footer={
        <>
          <Button variant="text" onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear ronda"}</Button>
        </>
      }
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField label="Nombre de la ronda" fullWidth size="small" placeholder="Ej.: Encuesta de Clima Q3 2026" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Grid>

        <Grid size={4}>
          <TextField select label="Estado" fullWidth size="small" value={form.status} onChange={(e) => set("status", e.target.value as CreateClimateSurveyRoundInput["status"])}>
            {ROUND_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={4}>
          <TextField label="Fecha inicial" type="date" fullWidth size="small" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={4}>
          <TextField label="Fecha final" type="date" fullWidth size="small" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>

        <Grid size={form.audience === "Equipo específico" ? 6 : 12}>
          <TextField select label="Público" fullWidth size="small" value={form.audience} onChange={(e) => set("audience", e.target.value as CreateClimateSurveyRoundInput["audience"])}>
            {AUDIENCES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>
        </Grid>
        {form.audience === "Equipo específico" && (
          <Grid size={6}>
            <TextField label="Equipo" fullWidth size="small" placeholder="Ej.: Ingeniería" value={form.audienceTeam ?? ""} onChange={(e) => set("audienceTeam", e.target.value)} />
          </Grid>
        )}

        <Grid size={4}>
          <TextField label="Respondientes" type="number" fullWidth size="small" value={form.respondents} onChange={(e) => set("respondents", Number(e.target.value))} />
        </Grid>
        <Grid size={4}>
          <TextField
            label="Colaboradores objetivo"
            type="number"
            fullWidth
            size="small"
            placeholder="Auto (headcount)"
            value={form.targetHeadcount ?? ""}
            onChange={(e) => set("targetHeadcount", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Grid>
        <Grid size={4}>
          <TextField
            label="eNPS (-100 a 100)"
            type="number"
            fullWidth
            size="small"
            placeholder="Opcional"
            value={form.enps ?? ""}
            onChange={(e) => set("enps", e.target.value === "" ? null : Number(e.target.value))}
            slotProps={{ htmlInput: { min: -100, max: 100 } }}
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>Categorías incluidas</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", mt: 0.5 }}>
            {CLIMATE_CATEGORIES.map((c) => (
              <FormControlLabel
                key={c}
                control={<Checkbox size="small" checked={(form.categories ?? []).includes(c)} onChange={() => toggleCategory(c)} />}
                label={<Typography variant="body2">{c}</Typography>}
              />
            ))}
          </Box>
        </Grid>

        <Grid size={12}>
          <TextField label="Notas (opcional)" fullWidth multiline minRows={2} size="small" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Grid>
      </Grid>
    </Modal>
  );
}
