import { useState, type ReactNode } from "react";
import { Box, Button, Card, Grid, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import { useCreateVacancy } from "../queries";
import { useToast } from "../../../components/common/ToastProvider";
import { SkillsEditor } from "../../../components/common/SkillsEditor";
import { PipelineStageEditor, type DraftStage } from "../components/PipelineStageEditor";
import { errorMessage } from "../../../components/common/ErrorState";
import { VACANCY_STATUSES, WORK_MODELS, SENIORITIES, type VacancyStatus, type WorkModel } from "../types";

const DEFAULT_STAGES = ["Candidatura", "Triagem", "Entrevista RH", "Entrevista Técnica", "Oferta", "Contratado"];

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
  const createVacancy = useCreateVacancy();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [workModel, setWorkModel] = useState<WorkModel>("Híbrido");
  const [seniority, setSeniority] = useState<string>("Pleno");
  const [status, setStatus] = useState<VacancyStatus>("Aberta");

  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");

  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [stages, setStages] = useState<DraftStage[]>(DEFAULT_STAGES.map((name, i) => ({ id: `draft-${i}`, name })));

  const canSubmit = title.trim() && department.trim() && location.trim() && stages.length > 0 && !createVacancy.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createVacancy.mutate(
      {
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
      },
      {
        onSuccess: (vacancy) => {
          toast.success("Vaga criada com sucesso");
          navigate(`/vagas/${vacancy.id}`);
        },
        onError: (err) => toast.error(errorMessage(err, "Não foi possível criar a vaga")),
      },
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 880, mx: "auto" }}>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/vagas")} sx={{ mb: 1.5 }}>Voltar para vagas</Button>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Criar nova vaga</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Preencha as informações abaixo para publicar uma nova vaga.</Typography>

      <SectionCard title="Informações básicas">
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField label="Nome da vaga" fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Engenheiro(a) de Software Backend" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Departamento" fullWidth size="small" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Localização" fullWidth size="small" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex.: Remoto, São Paulo…" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>Modalidade</Typography>
            <Select fullWidth size="small" value={workModel} onChange={(e) => setWorkModel(e.target.value as WorkModel)}>
              {WORK_MODELS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>Senioridade</Typography>
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

      <SectionCard title="Descrição">
        <Stack spacing={2}>
          <TextField label="Descrição da vaga" fullWidth multiline minRows={3} size="small" value={description} onChange={(e) => setDescription(e.target.value)} />
          <TextField label="Responsabilidades" fullWidth multiline minRows={3} size="small" value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} />
          <TextField label="Requisitos" fullWidth multiline minRows={3} size="small" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
        </Stack>
      </SectionCard>

      <SectionCard title="Competências necessárias" description="Usadas no match automático com o Banco de Talentos.">
        <SkillsEditor skills={requiredSkills} onChange={setRequiredSkills} />
      </SectionCard>

      <SectionCard title="Pipeline do processo seletivo" description="Configure as etapas pelas quais os candidatos vão passar.">
        <PipelineStageEditor stages={stages} onChange={setStages} />
      </SectionCard>

      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 1 }}>
        <Button onClick={() => navigate("/vagas")} disabled={createVacancy.isPending}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {createVacancy.isPending ? "Criando…" : "Criar vaga"}
        </Button>
      </Stack>
    </Box>
  );
}
