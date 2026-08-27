import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { useVacancies } from "../../vacancy/queries";
import { useAllApplications } from "../../kanban/queries";
import { useEmployees } from "../../people/queries";
import { useConsultingLeads } from "../../consulting/queries";
import { LIFECYCLE_STAGES } from "../../people/types";

const AREA_PALETTE = ["#4C9773", "#9BCBAE", "#CFE6D9", "#A66A1E", "#4A6FA5", "#8A5DA5"];
const LIFECYCLE_COLOR: Record<string, string> = {
  Recruitment: "#4A6FA5",
  Onboarding: "#9BCBAE",
  Development: "#5A8A6A",
  Performance: "#8A5DA5",
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

  const openVacancies = vacancies.filter((v) => v.status === "Aberta");
  const activeApplications = applications.filter((a) => a.status === "ACTIVE");
  const hiredApplications = applications.filter((a) => a.status === "HIRED");
  const avgCandidatesPerVacancy = vacancies.length ? (applications.length / vacancies.length).toFixed(1) : "0";
  const conversionRate = applications.length ? Math.round((hiredApplications.length / applications.length) * 100) : 0;

  const stageOrder = Array.from(new Set(applications.map((a) => a.currentStage)));
  const funnel = stageOrder
    .map((stage) => ({ stage, count: applications.filter((a) => a.currentStage === stage).length }))
    .sort((a, b) => b.count - a.count);
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  const activeEmployees = employees.filter((e) => e.status === "Active");
  const areaCounts = Object.entries(
    activeEmployees.reduce<Record<string, number>>((acc, e) => {
      const area = e.area || "Outro";
      acc[area] = (acc[area] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const clients = leads.filter((l) => l.status === "Cliente");

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">People Analytics</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>KPIs de Recruitment, People e impacto de negócio</Typography>
      </Box>

      {isLoading ? (
        <Stack spacing={2}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={160} />)}</Stack>
      ) : (
        <Stack spacing={4}>
          <Section title="🎯 Recruitment KPIs">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              <KpiCard label="Vagas abertas" value={String(openVacancies.length)} sub={`${vacancies.length} no total`} />
              <KpiCard label="Candidatos/Vaga" value={avgCandidatesPerVacancy} sub="média geral" />
              <KpiCard label="Conversion Rate" value={`${conversionRate}%`} sub="candidaturas → contratação" />
              <KpiCard label="Candidaturas ativas" value={String(activeApplications.length)} sub={`${applications.length} no total`} />
            </Box>
            {funnel.length > 0 && (
              <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5, mt: 2 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Funil de recrutamento (todas as vagas)</Typography>
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
              <KpiCard label="Headcount" value={String(activeEmployees.length)} sub="colaboradores ativos" />
              <KpiCard label="Offboarding" value={String(employees.filter((e) => e.status === "Offboarding").length)} sub="em transição" />
              <KpiCard label="Onboarding" value={String(employees.filter((e) => e.lifecycle === "Onboarding").length)} sub="fase atual" />
              <KpiCard label="Áreas" value={String(areaCounts.length)} sub="áreas distintas" />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mt: 2 }}>
              <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Distribuição por área</Typography>
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
                  {areaCounts.length === 0 && <Typography variant="body2" color="text.secondary">Sem dados suficientes.</Typography>}
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

          <Section title="⭐ Impacto de negócio">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              <ImpactCard icon="🏢" label="Empresas em pipeline" value={String(leads.length)} />
              <ImpactCard icon="🤝" label="Clientes ativos" value={String(clients.length)} />
              <ImpactCard icon="🎯" label="Vagas abertas" value={String(openVacancies.length)} />
              <ImpactCard icon="✅" label="Contratações" value={String(hiredApplications.length)} />
            </Box>
          </Section>
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
