import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useCandidate } from "../hooks/useCandidates";
export function CandidateDetailsPage() {
  const { id } = useParams();
  const { data: candidate, isLoading } = useCandidate(id);
  if (isLoading)
    return (
      <Box
        sx={{
          height: "calc(100vh - 68px)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  if (!candidate)
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Candidato não encontrado.</Alert>
      </Box>
    );
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1150, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <RouterLink
          to="/candidates"
          style={{ color: "#6957e9", textDecoration: "none" }}
        >
          Candidatos
        </RouterLink>
        <Typography color="text.secondary">Perfil</Typography>
      </Breadcrumbs>
      <Button
        component={RouterLink}
        to="/candidates"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ mb: 2 }}
      >
        Voltar para candidatos
      </Button>
      <Card sx={{ p: { xs: 2, md: 3 }, mb: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2.5}
          alignItems={{ sm: "center" }}
        >
          <Avatar src={candidate.avatar} sx={{ width: 82, height: 82 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontSize={{ xs: 28, md: 34 }}>
              {candidate.name}
            </Typography>
            <Typography color="text.secondary">
              {candidate.position} · {candidate.seniority}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
              <Chip
                label={candidate.status}
                color={
                  candidate.status === "Contratado" ? "success" : "primary"
                }
              />
              <Chip
                label={`R$ ${candidate.salary.toLocaleString("pt-BR")}`}
                variant="outlined"
              />
            </Stack>
          </Box>
          <Button variant="contained">Editar candidato</Button>
        </Stack>
      </Card>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 2 }}>
                  Experiência profissional
                </Typography>
                <Typography fontWeight={700}>
                  {candidate.position} · {candidate.company}
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mt: 0.5 }}
                >
                  {candidate.experience}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography fontWeight={700}>Formação</Typography>
                <Typography color="text.secondary" variant="body2">
                  {candidate.education}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                  Observações
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {candidate.notes}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                  Informações pessoais
                </Typography>
                <Stack spacing={1.25} color="text.secondary">
                  <Stack direction="row" gap={1}>
                    <EmailOutlinedIcon fontSize="small" />
                    <Typography variant="body2">{candidate.email}</Typography>
                  </Stack>
                  <Stack direction="row" gap={1}>
                    <PhoneOutlinedIcon fontSize="small" />
                    <Typography variant="body2">{candidate.phone}</Typography>
                  </Stack>
                  <Stack direction="row" gap={1}>
                    <LocationOnOutlinedIcon fontSize="small" />
                    <Typography variant="body2">
                      {candidate.location}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                  Competências
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {candidate.skills.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 1.2 }}>
                  Histórico
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Candidatura recebida em{" "}
                  {new Intl.DateTimeFormat("pt-BR").format(
                    new Date(candidate.appliedAt),
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Status atual: {candidate.status}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
