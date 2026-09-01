import { Box, Divider, Skeleton, Stack, Typography } from "@mui/material";
import { useVacancies } from "../../vacancy/queries";
import { useAllApplications } from "../../kanban/queries";
import { useEmployees } from "../../people/queries";
import { useConsultingLeads } from "../../consulting/queries";
import { LIFECYCLE_STAGES } from "../../people/types";
import { CustomKpiSection } from "../../workspace/components/CustomKpiSection";
import { CustomTasksSection } from "../../workspace/components/CustomTasksSection";
import { CustomNotesSection } from "../../workspace/components/CustomNotesSection";

const AREA_PALETTE = ["#4C9773", "#9BCBAE", "#CFE6D9", "#A66A1E", "#4A6FA5", "#8A5DA5"];
const LIFECYCLE_COLOR: Record<string, string> = {
  Reclutamiento: "#4A6FA5",
  Onboarding: "#9BCBAE",
  Desarrollo: "#5A8A6A",
  Desempeño: "#8A5DA5",
  Offboarding: "#6E7D74",
};

export function AnalyticsPage() {
  const { data: vacancyData, isLoading: vacanciesLoading } = useVacancies({ limit: 200 });
  const vacancies = vacancyData?.items ?? [];
  const { data: appData, isLoading: appsLoading } = useAllApplications();
  const applications = appData?.items ?? [];
  const { data: employeeData, isLoading: employeesLoading } = useEmployees({ limit: 200 });
  const employees = employeeData?.items ?? [];
  const { data: leadData } = useConsultingLeads();
  const leads = leadData?.items ?? [];

  const isLoading = vacanciesLoading || appsLoading || employeesLoading;

  const openVacancies = vacancies.filter((v) => v.status === "Abierta");
  const activeApplications = applications.filter((a) => a.status === "ACTIVE");
  const hiredApplications = applications.filter((a) => a.status === "HIRED");
  const avgCandidatesPerVacancy = vacancies.length ? (applications.length / vacancies.length).toFixed(1) : "0";
  const conversionRate = applications.length ? Math.round((hiredApplications.length / applications.length) * 100) : 0;

  const stageOrder = Array.from(new Set(applications.map((a) => a.currentStage)));
  const funnel = stageOrder
    .map((stage) => ({ stage, count: applications.filter((a) => a.currentStage === stage).length }))
    .sort((a, b) => b.count - a.count);
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  const activeEmployees = employees.filter((e) => e.status === "Activo");
  const areaCounts = Object.entries(
    activeEmployees.reduce<Record<string, number>>((acc, e) => {
      const area = e.area || "Otro";
      acc[area] = (acc[area] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const clients = leads.filter((l) => l.status === "Cliente");

  const closedVacancies = vacancies.filter((v) => v.closedAt);
  const avgDaysToClose = closedVacancies.length
    ? Math.round(
        closedVacancies.reduce((sum, v) => sum + Math.max(0, Math.round((new Date(v.closedAt!).getTime() - new Date(v.openingDate).getTime()) / 86_400_000)), 0) /
          closedVacancies.length,
      )
    : null;

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">People Analytics</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>KPIs de Recruitment, People e impacto de negocio</Typography>
      </Box>

      {isLoading ? (
        <Stack spacing={2}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={160} />)}</Stack>
      ) : (
        <Stack spacing={4}>
          <Section title="🎯 Recruitment KPIs">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 2 }}>
              <KpiCard label="Vacantes abiertas" value={String(openVacancies.length)} sub={`${vacancies.length} en total`} />
              <KpiCard label="Candidatos/Vacante" value={avgCandidatesPerVacancy} sub="promedio general" />
              <KpiCard label="Conversion Rate" value={`${conversionRate}%`} sub="candidaturas → contratación" />
              <KpiCard label="Tiempo real para cerrar" value={avgDaysToClose !== null ? `${avgDaysToClose}d` : "—"} sub={closedVacancies.length ? `promedio de ${closedVacancies.length} vacante(s) cerrada(s)` : "aún no hay vacantes cerradas"} />
              <KpiCard label="Candidaturas activas" value={String(activeApplications.length)} sub={`${applications.length} en total`} />
            </Box>
            {funnel.length > 0 && (
              <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5, mt: 2 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Embudo de reclutamiento (todas las vacantes)</Typography>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {funnel.map((f) => (
                    <Stack key={f.stage} direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0 }}>{f.stage}</Typography>
                      <Box sx={{ flex: 1, height: 22, bgcolor: "#E4EDE6", borderRadius: 2, overflow: "hidden" }}>
                        <Box sx={{ width: `${Math.max(6, (f.count / funnelMax) * 100)}%`, height: "100%", bgcolor: "primary.main", display: "flex", alignItems: "center", px: 1 }}>
                          <Typography variant="caption" color="#fff" fontWeight={700}>{f.count}</Typography>
                        </Box>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Section>

          <Section title="👥 People KPIs">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              <KpiCard label="Headcount" value={String(activeEmployees.length)} sub="colaboradores activos" />
              <KpiCard label="Offboarding" value={String(employees.filter((e) => e.status === "Offboarding").length)} sub="en transición" />
              <KpiCard label="Onboarding" value={String(employees.filter((e) => e.lifecycle === "Onboarding").length)} sub="fase actual" />
              <KpiCard label="Áreas" value={String(areaCounts.length)} sub="áreas distintas" />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mt: 2 }}>
              <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Distribución por área</Typography>
                <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                  {areaCounts.map(([area, count], i) => (
                    <Stack key={area} direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: AREA_PALETTE[i % AREA_PALETTE.length], flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>{area}</Typography>
                      <Box sx={{ flex: 1, height: 8, bgcolor: "#E4EDE6", borderRadius: 4, overflow: "hidden" }}>
                        <Box sx={{ width: `${(count / activeEmployees.length) * 100}%`, height: "100%", bgcolor: AREA_PALETTE[i % AREA_PALETTE.length] }} />
                      </Box>
                      <Typography variant="caption" fontWeight={700}>{count}</Typography>
                    </Stack>
                  ))}
                  {areaCounts.length === 0 && <Typography variant="body2" color="text.secondary">No hay datos suficientes.</Typography>}
                </Stack>
              </Box>
              <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Lifecycle</Typography>
                <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                  {LIFECYCLE_STAGES.map((stage) => {
                    const count = employees.filter((e) => e.lifecycle === stage).length;
                    return (
                      <Stack key={stage} direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: LIFECYCLE_COLOR[stage], flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>{stage}</Typography>
                        <Box sx={{ flex: 1, height: 8, bgcolor: "#E4EDE6", borderRadius: 4, overflow: "hidden" }}>
                          <Box sx={{ width: `${employees.length ? (count / employees.length) * 100 : 0}%`, height: "100%", bgcolor: LIFECYCLE_COLOR[stage] }} />
                        </Box>
                        <Typography variant="caption" fontWeight={700}>{count}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            </Box>
          </Section>

          <Section title="⭐ Impacto de negocio">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              <ImpactCard icon="🏢" label="Empresas en pipeline" value={String(leads.length)} />
              <ImpactCard icon="🤝" label="Clientes activos" value={String(clients.length)} />
              <ImpactCard icon="🎯" label="Vacantes abiertas" value={String(openVacancies.length)} />
              <ImpactCard icon="✅" label="Contrataciones" value={String(hiredApplications.length)} />
            </Box>
          </Section>

          <Divider sx={{ my: 1 }} />

          <Box>
            <Typography fontWeight={800} fontSize={19} sx={{ mb: 0.25 }}>🗂️ Tu panel</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              A diferencia de las secciones de arriba (que se calculan solas a partir del ATS), esto es 100% tuyo: agrega, edita y elimina lo que necesites, sea de la empresa o personal.
            </Typography>
            <Stack spacing={4}>
              <CustomKpiSection />
              <CustomTasksSection />
              <CustomNotesSection />
            </Stack>
          </Box>
        </Stack>
      )}
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography fontWeight={800} fontSize={17} sx={{ mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.25 }}>
      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, mt: 0.25 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{sub}</Typography>
    </Box>
  );
}

function ImpactCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: "#F1F7F2", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.25, textAlign: "center" }}>
      <Typography fontSize={22}>{icon}</Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 800, color: "primary.main", mt: 0.5 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
    </Box>
  );
}
