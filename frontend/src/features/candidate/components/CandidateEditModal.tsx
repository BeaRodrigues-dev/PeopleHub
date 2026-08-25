import { useEffect, useState } from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useUIStore } from "../../../store/uiStore";
import { useCandidate, useUpdateCandidate } from "../queries";
import { useVacancy } from "../../vacancy/queries";
import { CandidateForm, emptyCandidateForm, isCandidateFormValid, type CandidateFormValues } from "./CandidateForm";

/** Modal de edição — item 7 do escopo original. Salva via PATCH /candidates/:id (React Query + optimistic update). */
export function CandidateEditModal() {
  const editingId = useUIStore((s) => s.editingCandidateId);
  const close = useUIStore((s) => s.closeEdit);
  const toast = useToast();
  const { data: candidate } = useCandidate(editingId);
  const { data: vacancy } = useVacancy(candidate?.vacancyId);
  const updateCandidate = useUpdateCandidate();

  const [values, setValues] = useState<CandidateFormValues>(emptyCandidateForm);

  useEffect(() => {
    if (candidate) {
      setValues({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone ?? "",
        location: candidate.location ?? "",
        skills: candidate.skills,
        seniority: candidate.seniority ?? "Pleno",
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
          toast.success("Candidato atualizado");
          close();
        },
        onError: (err) => toast.error(errorMessage(err, "Não foi possível salvar as alterações")),
      },
    );
  };

  return (
    <Modal
      open={!!editingId}
      onClose={close}
      title="Editar candidato"
      subtitle={candidate.name}
      width={680}
      footer={
        <>
          <Button onClick={close} disabled={updateCandidate.isPending}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!isCandidateFormValid(values) || updateCandidate.isPending}>
            {updateCandidate.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </>
      }
    >
      <CandidateForm
        values={values}
        onChange={setValues}
        extraContent={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5, p: 1.25, borderRadius: 2.5, bgcolor: "action.hover" }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Vaga atribuída: <strong>{vacancy?.title ?? "Banco de Talentos"}</strong>. Para mudar a vaga ou a etapa, use o Kanban ou o Banco de Talentos.
            </Typography>
            {vacancy && <Chip label={vacancy.status} size="small" />}
          </Stack>
        }
      />
    </Modal>
  );
}
