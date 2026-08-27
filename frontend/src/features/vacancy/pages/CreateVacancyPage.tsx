import { useEffect, useState, type ReactNode } from "react";
import { Box, Button, Card, Grid, MenuItem, Select, Skeleton, Stack, TextField, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateVacancy, useUpdateVacancy, useVacancy } from "../queries";
import { useToast } from "../../../components/common/ToastProvider";
import { SkillsEditor } from "../../../components/common/SkillsEditor";
import { PipelineStageEditor, type DraftStage } from "../components/PipelineStageEditor";
import { errorMessage } from "../../../components/common/ErrorState";
import { VACANCY_STATUSES, WORK_MODELS, SENIORITIES, type VacancyStatus, type WorkModel } from "../types";

const DEFAULT_STAGES = ["Candidatura", "Preselección", "Entrevista RR. HH.", "Entrevista Técnica", "Oferta", "Contratado"];

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, mb: 2.5 }}>
      <Typography fontWeight={800} fontSize={16}>{title}</Typography>
      {description ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 2.25 }}>{description}</Typography> : <Box sx={{ mb: 2.25 }} />}
      {children}
    </Card>
  );
}

export function CreateVacancyPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { data: existingVacancy, isLoading: loadingExisting } = useVacancy(id);
  const createVacancy = useCreateVacancy();
  const updateVacancy = useUpdateVacancy();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [workModel, setWorkModel] = useState<WorkModel>("Híbrido");
  const [seniority, setSeniority] = useState<string>("Semi Senior");
  const [status, setStatus] = useState<VacancyStatus>("Abierta");

  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");

  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [stages, setStages] = useState<DraftStage[]>(DEFAULT_STAGES.map((name, i) => ({ id: `draft-${i}`, name })));

  useEffect(() => {
    if (!existingVacancy) return;
    setTitle(existingVacancy.title);
    setDepartment(existingVacancy.department ?? "");
    setLocation(existingVacancy.location ?? "");
    setWorkModel(existingVacancy.workModel);
    setSeniority(existingVacancy.seniority ?? "Semi Senior");
    setStatus(existingVacancy.status);
    setDescription(existingVacancy.description ?? "");
    setResponsibilities(existingVacancy.responsibilities ?? "");
    setRequirements(existingVacancy.requirements ?? "");
    setRequiredSkills(existingVacancy.requiredSkills);
    setStages([...existingVacancy.stages].sort((a, b) => a.order - b.order));
  }, [existingVacancy]);

  const isSaving = createVacancy.isPending || updateVacancy.isPending;
  const canSubmit = title.trim() && department.trim() && location.trim() && stages.length > 0 && !isSaving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      workModel,
      seniority,
      status,
      description,
      responsibilities,
      requirements,
      requiredSkills,
      stages: stages.map((s, i) => ({ name: s.name, order: i, isTerminal: i === stages.length - 1 })),
    };

    if (isEditing && id) {
      updateVacancy.mutate(
        { id, input: payload },
        {
          onSuccess: () => {
            toast.success("Vacante actualizada con éxito");
            navigate(`/vagas/${id}`);
          },
          onError: (err) => toast.error(errorMessage(err, "No se pudieron guardar los cambios")),
        },
      );
      return;
    }

    createVacancy.mutate(payload, {
      onSuccess: (vacancy) => {
        toast.success("Vacante creada con éxito");
        navigate(`/vagas/${vacancy.id}`);
      },
      onError: (err) => toast.error(errorMessage(err, "No fue posible crear la vacante")),
    });
  };

  if (isEditing && loadingExisting) {
    return (
      <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 880, mx: "auto" }}>
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 880, mx: "auto" }}>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(isEditing ? `/vagas/${id}` : "/vagas")} sx={{ mb: 1.5 }}>
        {isEditing ? "Volver a la vacante" : "Volver a vacantes"}
      </Button>
      <Typography variant="h4" sx={{ mb: 0.5 }}>{isEditing ? "Editar vacante" : "Crear nueva vacante"}</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
        {isEditing ? "Actualiza la información de la vacante." : "Completa la información a continuación para publicar una nueva vacante."}
      </Typography>

      <SectionCard title="Información básica">
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField label="Nombre de la vacante" fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: Ingeniero(a) de Software Backend" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Departamento" fullWidth size="small" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Ubicación" fullWidth size="small" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej.: Remoto, Madrid…" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>Modalidade</Typography>
            <Select fullWidth size="small" value={workModel} onChange={(e) => setWorkModel(e.target.value as WorkModel)}>
              {WORK_MODELS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>Nivel de experiencia</Typography>
            <Select fullWidth size="small" value={seniority} onChange={(e) => setSeniority(e.target.value)}>
              {SENIORITIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>Status</Typography>
            <Select fullWidth size="small" value={status} onChange={(e) => setStatus(e.target.value as VacancyStatus)}>
              {VACANCY_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Descripción">
        <Stack spacing={2}>
          <TextField label="Descripción de la vacante" fullWidth multiline minRows={3} size="small" value={description} onChange={(e) => setDescription(e.target.value)} />
          <TextField label="Responsabilidades" fullWidth multiline minRows={3} size="small" value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} />
          <TextField label="Requisitos" fullWidth multiline minRows={3} size="small" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
        </Stack>
      </SectionCard>

      <SectionCard title="Competencias necesarias" description="Se usan en el match automático con el Banco de Talentos.">
        <SkillsEditor skills={requiredSkills} onChange={setRequiredSkills} />
      </SectionCard>

      <SectionCard title="Pipeline del proceso de selección" description="Configura las etapas por las que pasarán los candidatos.">
        <PipelineStageEditor stages={stages} onChange={setStages} />
      </SectionCard>

      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 1 }}>
        <Button onClick={() => navigate(isEditing ? `/vagas/${id}` : "/vagas")} disabled={isSaving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear vacante"}
        </Button>
      </Stack>
    </Box>
  );
}
