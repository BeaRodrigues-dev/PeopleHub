import { useEffect, useState } from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useUIStore } from "../../../store/uiStore";
import { useCandidate, useDeleteCandidate, useUpdateCandidate } from "../queries";
import { useVacancy } from "../../vacancy/queries";
import { CandidateForm, emptyCandidateForm, isCandidateFormValid, type CandidateFormValues } from "./CandidateForm";

/** Modal de edición — ítem 7 del alcance original. Guarda vía PATCH /candidates/:id (React Query + optimistic update). */
export function CandidateEditModal() {
  const editingId = useUIStore((s) => s.editingCandidateId);
  const close = useUIStore((s) => s.closeEdit);
  const toast = useToast();
  const { data: candidate } = useCandidate(editingId);
  const { data: vacancy } = useVacancy(candidate?.vacancyId);
  const updateCandidate = useUpdateCandidate();
  const deleteCandidate = useDeleteCandidate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [values, setValues] = useState<CandidateFormValues>(emptyCandidateForm);

  useEffect(() => {
    if (candidate) {
      setValues({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone ?? "",
        location: candidate.location ?? "",
        skills: candidate.skills,
        seniority: candidate.seniority ?? "Semi Senior",
        linkedin: candidate.linkedin ?? "",
        portfolio: candidate.portfolio ?? "",
        notes: candidate.notes ?? "",
      });
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleSave = () => {
    updateCandidate.mutate(
      { id: candidate.id, input: values },
      {
        onSuccess: () => {
          toast.success("Candidato actualizado");
          close();
        },
        onError: (err) => toast.error(errorMessage(err, "No se pudieron guardar los cambios")),
      },
    );
  };

  const handleDelete = () => {
    deleteCandidate.mutate(candidate.id, {
      onSuccess: () => {
        toast.success("Candidato eliminado");
        setConfirmDelete(false);
        close();
      },
      onError: (err) => toast.error(errorMessage(err, "No se pudo eliminar el candidato")),
    });
  };

  return (
    <Modal
      open={!!editingId}
      onClose={close}
      title="Editar candidato"
      subtitle={candidate.name}
      width={680}
      footer={
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
          <Button color="error" onClick={() => setConfirmDelete(true)} disabled={updateCandidate.isPending}>Eliminar candidato</Button>
          <Stack direction="row" spacing={1.25}>
            <Button onClick={close} disabled={updateCandidate.isPending}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave} disabled={!isCandidateFormValid(values) || updateCandidate.isPending}>
              {updateCandidate.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </Stack>
        </Stack>
      }
    >
      <CandidateForm
        values={values}
        onChange={setValues}
        extraContent={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5, p: 1.25, borderRadius: 2.5, bgcolor: "action.hover" }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Vacante atribuída: <strong>{vacancy?.title ?? "Banco de Talentos"}</strong>. Para cambiar la vacante o la etapa, usa el Kanban o el Banco de Talentos.
            </Typography>
            {vacancy && <Chip label={vacancy.status} size="small" />}
          </Stack>
        }
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar candidato"
        description={`¿Estás seguro de que deseas eliminar "${candidate.name}"? Esta acción no se puede deshacer.`}
        loading={deleteCandidate.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </Modal>
  );
}
