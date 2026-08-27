import { useEffect, useState } from "react";
import { Box, Button, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateOnboarding, useUpdateOnboarding } from "../queries";
import { onboardingApi } from "../api";
import { DEFAULT_CHECKLIST, type OnboardingChecklist, type OnboardingEntry } from "../types";

export function AddOnboardingModal({ open, onClose, entry }: { open: boolean; onClose: () => void; entry?: OnboardingEntry | null }) {
  const isEditing = !!entry;
  const [employeeName, setEmployeeName] = useState("");
  const [role, setRole] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [checklist, setChecklist] = useState<OnboardingChecklist>(DEFAULT_CHECKLIST);
  const [suggesting, setSuggesting] = useState(false);
  const createOnboarding = useCreateOnboarding();
  const updateOnboarding = useUpdateOnboarding();
  const toast = useToast();

  const reset = () => {
    setEmployeeName("");
    setRole("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setChecklist(DEFAULT_CHECKLIST);
  };

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setEmployeeName(entry.employeeName);
      setRole(entry.role);
      setStartDate(entry.startDate);
      setChecklist(entry.checklist);
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry]);

  const isSaving = createOnboarding.isPending || updateOnboarding.isPending;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSuggest = async () => {
    if (!role.trim()) {
      toast.error("Ingresa el cargo para sugerir el checklist.");
      return;
    }
    setSuggesting(true);
    try {
      const suggestion = await onboardingApi.suggestChecklist(role);
      setChecklist(suggestion);
      toast.success("Checklist sugerido por la IA a partir del cargo.");
    } catch (error) {
      toast.error(errorMessage(error, "No fue posible sugerir el checklist."));
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = () => {
    if (!employeeName.trim() || !role.trim()) {
      toast.error("Completa el nombre y el cargo.");
      return;
    }
    if (isEditing && entry) {
      updateOnboarding.mutate(
        { id: entry.id, input: { employeeName, role, startDate, checklist } },
        {
          onSuccess: () => { toast.success("Onboarding actualizado."); handleClose(); },
          onError: (error) => toast.error(errorMessage(error, "No se pudieron guardar los cambios.")),
        },
      );
      return;
    }
    createOnboarding.mutate(
      { employeeName, role, startDate, checklist },
      {
        onSuccess: () => {
          toast.success("Onboarding creado.");
          handleClose();
        },
        onError: (error) => toast.error(errorMessage(error, "No fue posible crear el onboarding.")),
      },
    );
  };

  const totalItems = checklist.before.length + checklist.day1.length + checklist.week1.length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar onboarding" : "Nuevo onboarding"}
      subtitle={isEditing ? undefined : "Crea el proceso de ingreso de un nuevo colaborador."}
      width={560}
      footer={
        <>
          <Button variant="text" onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear onboarding"}
          </Button>
        </>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={12}>
          <TextField label="Nombre del colaborador" fullWidth size="small" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
        </Grid>
        <Grid size={7}>
          <TextField label="Cargo" fullWidth size="small" value={role} onChange={(e) => setRole(e.target.value)} />
        </Grid>
        <Grid size={5}>
          <TextField label="Fecha de ingreso" type="date" fullWidth size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
      </Grid>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="body2" fontWeight={700}>Checklist ({totalItems} ítems)</Typography>
        <Button size="small" variant="outlined" startIcon={<AutoAwesomeRoundedIcon fontSize="small" />} onClick={handleSuggest} disabled={suggesting}>
          {suggesting ? "Sugiriendo…" : "Sugerir con IA"}
        </Button>
      </Stack>
      <Stack spacing={1.25}>
        {(["before", "day1", "week1"] as const).map((phase) => (
          <Box key={phase} sx={{ bgcolor: "#F1F7F2", borderRadius: 2.5, p: 1.5 }}>
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>
              {phase === "before" ? "Antes del 1er día" : phase === "day1" ? "1er día" : "1ª semana"}
            </Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.6} sx={{ mt: 0.6 }}>
              {checklist[phase].map((item, i) => (
                <Chip key={i} label={item.label} size="small" sx={{ bgcolor: "#fff", border: "1px solid", borderColor: "divider" }} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Modal>
  );
}
