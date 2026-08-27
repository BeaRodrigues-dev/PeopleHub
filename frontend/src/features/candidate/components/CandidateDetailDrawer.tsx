import { useMemo } from "react";
import { Avatar, Box, Button, Chip, CircularProgress, MenuItem, Select, Stack, Typography } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import { useNavigate } from "react-router-dom";
import { SidePanel } from "../../../components/common/SidePanel";
import { useUIStore } from "../../../store/uiStore";
import { useCandidate } from "../queries";
import { useVacancy } from "../../vacancy/queries";
import { useCandidateApplications, useMoveApplicationStage } from "../../kanban/queries";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ py: 2, borderBottom: "1px solid", borderColor: "divider", "&:last-of-type": { borderBottom: "none" } }}>
      <Typography variant="overline" color="text.secondary" fontWeight={750} sx={{ letterSpacing: ".06em" }}>{title}</Typography>
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Box>
  );
}

export function CandidateDetailDrawer() {
  const selectedId = useUIStore((s) => s.selectedCandidateId);
  const close = useUIStore((s) => s.closeCandidate);
  const openEdit = useUIStore((s) => s.openEdit);
  const navigate = useNavigate();
  const { data: candidate, isLoading } = useCandidate(selectedId);
  const { data: vacancy } = useVacancy(candidate?.vacancyId);
  const { data: applicationsPage } = useCandidateApplications(candidate?.id);
  const moveStage = useMoveApplicationStage(vacancy?.id ?? "");

  const activeApplication = useMemo(
    () => applicationsPage?.items.find((a) => a.vacancyId === candidate?.vacancyId) ?? null,
    [applicationsPage, candidate?.vacancyId],
  );

  const stages = useMemo(() => (vacancy ? [...vacancy.stages].sort((a, b) => a.order - b.order) : []), [vacancy]);
  const currentStage = stages.find((s) => s.name === activeApplication?.currentStage) ?? null;
  const nextStage = currentStage ? stages.find((s) => s.order === currentStage.order + 1) ?? null : null;

  return (
    <SidePanel
      open={!!selectedId}
      onClose={close}
      title={candidate?.name ?? (isLoading ? "Carregando…" : "Candidato")}
      subtitle={vacancy ? `${vacancy.title} · ${currentStage?.name ?? "—"}` : "Banco de Talentos"}
      width={460}
      footer={
        candidate?.vacancyId && vacancy && activeApplication
          ? (
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Button
                variant="contained"
                startIcon={<ArrowForwardRoundedIcon />}
                disabled={!nextStage || moveStage.isPending}
                onClick={() => nextStage && moveStage.mutate({ applicationId: activeApplication.id, stage: nextStage.name })}
                sx={{ flexShrink: 0 }}
              >
                {nextStage ? "Avançar etapa" : "Etapa final"}
              </Button>
              <Select
                size="small"
                fullWidth
                value={currentStage?.name ?? ""}
                displayEmpty
                onChange={(e) => moveStage.mutate({ applicationId: activeApplication.id, stage: e.target.value })}
                renderValue={(value) => (value ? `Mover para: ${value}` : "Mover para…")}
              >
                {stages.map((stage) => <MenuItem key={stage.id} value={stage.name}>{stage.name}</MenuItem>)}
              </Select>
            </Stack>
          )
          : null
      }
    >
      {isLoading && !candidate ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress size={28} /></Box>
      ) : !candidate ? (
        <Typography color="text.secondary">Candidato não encontrado.</Typography>
      ) : (
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Avatar src={candidate.avatar ?? undefined} sx={{ width: 64, height: 64, fontSize: 22 }}>{candidate.name[0]}</Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary" sx={{ mb: 0.4 }}>
                <EmailOutlinedIcon sx={{ fontSize: 15 }} />
                <Typography variant="body2" noWrap>{candidate.email}</Typography>
              </Stack>
              {candidate.phone && (
                <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary" sx={{ mb: 0.4 }}>
                  <PhoneOutlinedIcon sx={{ fontSize: 15 }} />
                  <Typography variant="body2">{candidate.phone}</Typography>
                </Stack>
              )}
              {candidate.location && (
                <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
                  <LocationOnOutlinedIcon sx={{ fontSize: 15 }} />
                  <Typography variant="body2">{candidate.location}</Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          <Button size="small" variant="outlined" startIcon={<EditRoundedIcon fontSize="small" />} onClick={() => openEdit(candidate.id)} sx={{ mt: 1 }}>
            Editar candidato
          </Button>

          {vacancy && (
            <Section title="Vaga">
              <Box
                onClick={() => { close(); navigate(`/vagas/${vacancy.id}`); }}
                sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", cursor: "pointer", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" } }}
              >
                <WorkOutlineRoundedIcon color="primary" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={700} fontSize={14} noWrap>{vacancy.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{vacancy.department} · Etapa: {currentStage?.name ?? "—"}</Typography>
                </Box>
              </Box>
            </Section>
          )}

          <Section title="Competências">
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {candidate.skills.length === 0 && <Typography variant="body2" color="text.secondary">Nenhuma competência registrada.</Typography>}
              {candidate.skills.map((skill) => (
                <Chip key={skill} label={skill} size="small" color="primary" variant="outlined" sx={{ fontWeight: 650 }} />
              ))}
            </Stack>
          </Section>

          {candidate.experience.length > 0 && (
            <Section title="Experiência">
              <Stack spacing={1.25}>
                {candidate.experience.map((exp, i) => (
                  <Box key={i}>
                    <Typography fontWeight={700} fontSize={13.5}>{exp.role} · {exp.company}</Typography>
                    <Typography variant="caption" color="text.secondary">{[exp.startDate, exp.current ? "atual" : exp.endDate].filter(Boolean).join(" — ")}</Typography>
                    {exp.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{exp.description}</Typography>}
                  </Box>
                ))}
              </Stack>
            </Section>
          )}

          {candidate.resumeUrl && (
            <Section title="Currículo">
              <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "action.hover" }}>
                <DescriptionOutlinedIcon color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Arquivo enviado pelo candidato</Typography>
                <Button size="small" endIcon={<LaunchRoundedIcon fontSize="small" />} href={candidate.resumeUrl ?? "#"} target="_blank" rel="noreferrer">
                  Abrir
                </Button>
              </Stack>
            </Section>
          )}

          <Section title="Observações">
            <Typography variant="body2" color="text.secondary">{candidate.notes || "Nenhuma observação registrada."}</Typography>
          </Section>
        </Box>
      )}
    </SidePanel>
  );
}
