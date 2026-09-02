import { Box, Divider, Skeleton, Stack, Typography } from "@mui/material";
import { useVacancies } from "../../vacancy/queries";
import { useEmployees } from "../../people/queries";
import { useConsultingLeads } from "../../consulting/queries";
import { LIFECYCLE_STAGES } from "../../people/types";
import { CustomKpiSection } from "../../workspace/components/CustomKpiSection";
import { CustomTasksSection } from "../../workspace/components/CustomTasksSection";
import { CustomNotesSection } from "../../workspace/components/CustomNotesSection";
import { countHires, countInProcess } from "../../vacancy/types";

const AREA_PALETTE = ["#6C5CE0", "#E4DFFB", "#F1EEFD", "#D6A65D", "#5646C4", "#6C5CE0"];
const LIFECYCLE_COLOR: Record<string, string> = {
  Reclutamiento: "#5646C4",
  Onboarding: "#E4DFFB",
  Desarrollo: "#9B8FEA",
  Desempeño: "#6C5CE0",
  Offboarding: "#6B7086",
};

export function AnalyticsPage() {
  const { data: vacancyData, isLoading: vacanciesLoading } = useVacancies({ limit: 200 });
  const vacancies = vacancyData?.items ?? [];
  const { data: employeeData, isLoading: employeesLoading } = useEmployees({ limit: 200 });
  const employees = employeeData?.items ?? [];
  const { data: leadData } = useConsultingLeads();
  const leads = leadData?.items ?? [];

  const isLoading = vacanciesLoading || employeesLoading;

  // Recruitment: esta app es un panel de control manual (no el ATS real de
  // quien la usa) — los números de candidatos/etapas se cargan a mano por
  // vaga (vacancy.candidatesReceived, vacancy.stages[].count), no se cuentan
  // candidatos reales insertados aquí.
  const openVacancies = vacancies.filter((v) => v.status === "Abierta");
  const totalCandidatesReceived = vacancies.reduce((sum, v) => sum + (v.candidatesReceived ?? 0), 0);
  const totalHires = vacancies.reduce((sum, v) => sum + countHires(v.stages ?? []), 0);
  const totalInProcess = vacancies.reduce((sum, v) => sum + countInProcess(v.stages ?? []), 0);
  const avgCandidatesPerVacancy = vacancies.length ? (totalCandidatesReceived / vacancies.length).toFixed(1) : "0";
  const conversionRate = totalCandidatesReceived ? Math.round((totalHires / totalCandidatesReceived) * 100) : 0;

  const avgOf = (values: number[]) => (values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null);
  const avgDaysToFirstInterview = avgOf(vacancies.map((v) => v.daysToFirstInterview).filter((v): v is number => v !== null));
  const avgDaysToFirstOffer = avgOf(vacancies.map((v) => v.daysToFirstOffer).filter((v): v is number => v !== null));
  const retentionValues = vacancies.map((v) => v.retentionRate).filter((v): v is number => v !== null);
  const avgRetention = retentionValues.length ? Math.round(retentionValues.reduce((sum, v) => sum + v, 0) / retentionValues.length) : null;
  const sourceCounts = new Map<string, number>();
  for (const v of vacancies) {
    const source = (v.bestSource ?? "").trim();
    if (!source) continue;
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  }
  const topSource = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const funnelTotals = new Map<string, number>();
  for (const v of vacancies) {
    for (const stage of v.stages ?? []) {
      funnelTotals.set(stage.name, (funnelTotals.get(stage.name) ?? 0) + (stage.count ?? 0));
    }
  }
  const funnel = [...funnelTotals.entries()].map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count);
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
          <Section title="🎯 Recruitment KPIs" subtitle="Cargados a mano por vaga — este panel no cuenta candidatos reales, es tu resumen de control.">
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em", display: "block", mb: 1 }}>Volumen</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              <KpiCard label="Vacantes abiertas" value={String(openVacancies.length)} sub={`${vacancies.length} en total`} />
              <KpiCard label="Vacantes cerradas" value={String(closedVacancies.length)} sub="del total de vacantes" />
              <KpiCard label="Candidatos recibidos" value={String(totalCandidatesReceived)} sub="suma de todas las vacantes" />
              <KpiCard label="Contrataciones" value={String(totalHires)} sub="candidatos en etapa final" />
            </Box>

            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em", display: "block", mt: 2.5, mb: 1 }}>Eficiencia</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              <KpiCard label="Tiempo real para cerrar" value={avgDaysToClose !== null ? `${avgDaysToClose}d` : "—"} sub={closedVacancies.length ? `promedio de ${closedVacancies.length} vacante(s)` : "aún no hay vacantes cerradas"} />
              <KpiCard label="Tiempo a 1ª entrevista" value={avgDaysToFirstInterview !== null ? `${avgDaysToFirstInterview}d` : "—"} sub="promedio cargado a mano" />
              <KpiCard label="Tiempo a oferta" value={avgDaysToFirstOffer !== null ? `${avgDaysToFirstOffer}d` : "—"} sub="promedio cargado a mano" />
              <KpiCard label="Candidatos/Vacante" value={avgCandidatesPerVacancy} sub="promedio general" />
            </Box>

            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em", display: "block", mt: 2.5, mb: 1 }}>Calidad</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              <KpiCard label="Conversion Rate" value={`${conversionRate}%`} sub="candidatos → contratación" />
              <KpiCard label="Retención de contratados" value={avgRetention !== null ? `${avgRetention}%` : "—"} sub="promedio cargado a mano" />
              <KpiCard label="Mejor fuente" value={topSource ? topSource[0] : "—"} sub={topSource ? `en ${topSource[1]} vacante(s)` : "sin datos cargados"} />
              <KpiCard label="Candidatos en proceso" value={String(totalInProcess)} sub="en todas las vacantes" />
            </Box>

            {funnel.length > 0 && (
              <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5, mt: 2 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Embudo de reclutamiento (todas las vacantes)</Typography>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {funnel.map((f) => (
                    <Stack key={f.stage} direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0 }}>{f.stage}</Typography>
                      <Box sx={{ flex: 1, height: 22, bgcolor: "#EFEDFB", borderRadius: 2, overflow: "hidden" }}>
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
                      <Box sx={{ flex: 1, height: 8, bgcolor: "#EFEDFB", borderRadius: 4, overflow: "hidden" }}>
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
                        <Box sx={{ flex: 1, height: 8, bgcolor: "#EFEDFB", borderRadius: 4, overflow: "hidden" }}>
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
              <ImpactCard icon="✅" label="Contrataciones" value={String(totalHires)} />
            </Box>
          </Section>

          <Divider sx={{ my: 1 }} />

          <Box>
            <Typography fontWeight={800} fontSize={19} sx={{ mb: 0.25 }}>🗂️ Tu panel</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
A diferencia de las secciones de arriba (que resumen los datos de People, Onboarding y Consulting cargados en la app), esto es 100% libre: agrega, edita y elimina lo que necesites, sea de la empresa o personal.
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

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography fontWeight={800} fontSize={17}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1.5 }}>{subtitle}</Typography>}
      {!subtitle && <Box sx={{ mb: 1.5 }} />}
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
    <Box sx={{ bgcolor: "#F3F1FC", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.25, textAlign: "center" }}>
      <Typography fontSize={22}>{icon}</Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 800, color: "primary.main", mt: 0.5 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
    </Box>
  );
}
