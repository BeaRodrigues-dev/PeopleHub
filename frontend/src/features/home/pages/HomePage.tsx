import { useMemo, useState } from "react";
import { Box, Button, Chip, Skeleton, Stack, Typography, alpha } from "@mui/material";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useNavigate } from "react-router-dom";
import { useVacancies } from "../../vacancy/queries";
import { useVacancyCandidateCounts } from "../../candidate/queries";
import { useEmployees } from "../../people/queries";
import { useOnboardings } from "../../onboarding/queries";
import { useConsultingLeads } from "../../consulting/queries";
import { useInsights, useGenerateInsightsWithAi } from "../../insights/queries";
import { useTalentPool } from "../../talent-bank/queries";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";

const INSIGHT_STYLE: Record<string, { bg: string; border: string; label: string; icon: string }> = {
  problem: { bg: "#FDF2F2", border: "#F3C6C6", label: "Problema", icon: "🔴" },
  opportunity: { bg: "#F1F8F3", border: "#B7D8C2", label: "Oportunidade", icon: "🟡" },
  suggestion: { bg: "#F1F6FB", border: "#C6D9F3", label: "Sugestão", icon: "🔵" },
};

interface LocalTask {
  id: number;
  text: string;
  day: "today" | "week" | "pending";
  done: boolean;
}

const INITIAL_TASKS: LocalTask[] = [
  { id: 1, text: "Rever candidaturas em Triagem", day: "today", done: false },
  { id: 2, text: "Follow-up com empresas em negociação", day: "today", done: false },
  { id: 3, text: "Atualizar checklist de onboarding ativo", day: "today", done: true },
  { id: 4, text: "Publicar nova vaga em aberto", day: "week", done: false },
  { id: 5, text: "Preparar weekly report", day: "week", done: false },
  { id: 6, text: "Revisar pipeline de consulting", day: "week", done: false },
  { id: 7, text: "Definir metas de People para o próximo ciclo", day: "pending", done: false },
];

function formatToday(): string {
  const text = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tasks, setTasks] = useState<LocalTask[]>(INITIAL_TASKS);
  const [activeDay, setActiveDay] = useState<"today" | "week" | "pending">("today");

  const { data: vacancyData, isLoading: vacanciesLoading } = useVacancies({ limit: 200 });
  const vacancies = vacancyData?.items ?? [];
  const { data: counts } = useVacancyCandidateCounts(vacancies.map((v) => v.id));
  const { data: employeeData, isLoading: employeesLoading } = useEmployees({ limit: 200 });
  const employees = employeeData?.items ?? [];
  const { data: onboardingData, isLoading: onboardingsLoading } = useOnboardings();
  const onboardings = onboardingData?.items ?? [];
  const { data: leadData } = useConsultingLeads();
  const leads = leadData?.items ?? [];
  const { data: insightData } = useInsights();
  const insights = insightData?.items ?? [];
  const { data: poolData } = useTalentPool({ limit: 1 });
  const generateInsights = useGenerateInsightsWithAi();

  const openVacancies = vacancies.filter((v) => v.status === "Aberta");
  const activeCandidates = Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0);
  const activeEmployees = employees.filter((e) => e.status === "Active");
  const offboardingEmployees = employees.filter((e) => e.status === "Offboarding");
  const activeOnboardings = onboardings.filter((o) => o.status !== "Completed");
  const clients = leads.filter((l) => l.status === "Cliente");

  const filteredTasks = tasks.filter((t) => t.day === activeDay);
  const toggleTask = (id: number) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const recentInsights = useMemo(() => insights.slice(0, 4), [insights]);

  const isLoading = vacanciesLoading || employeesLoading || onboardingsLoading;

  const handleGenerateInsights = () => {
    generateInsights.mutate(undefined, {
      onSuccess: (created) => toast.success(`${created.length} novo(s) insight(s) gerado(s) com IA.`),
      onError: (error) => toast.error(errorMessage(error, "Não foi possível gerar insights.")),
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {formatToday()}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.4 }}>Olá, Beatriz 👋</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>Aqui está o teu resumo de People & HR para hoje.</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <StatCard label="Colaboradores" value={isLoading ? undefined : activeEmployees.length} sub={`${offboardingEmployees.length} em offboarding`} color="#B7D8C2" />
        <StatCard label="Vagas abertas" value={isLoading ? undefined : openVacancies.length} sub={`${vacancies.length} total`} color="#7FAE8E" light />
        <StatCard label="Candidatos ativos" value={isLoading ? undefined : activeCandidates} sub="em pipelines de vagas" color="#2E6B4F" light />
        <StatCard label="Pipeline Consulting" value={isLoading ? undefined : leads.length} sub={`${clients.length} cliente(s)`} color="#E7F2EA" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" }, gap: 2.5, mb: 3 }}>
        <PanelCard title="HR Overview" icon={<BarChartRoundedIcon fontSize="small" />}>
          <OverviewRow label="Onboardings ativos" value={String(activeOnboardings.length)} />
          <OverviewRow label="Talentos no pool" value={String(poolData?.total ?? 0)} />
          <OverviewRow label="Empresas em pipeline" value={String(leads.length)} />
          <OverviewRow label="Insights registados" value={String(insights.length)} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 1.5, mt: 1, borderTop: "1px solid", borderColor: "divider" }}>
            {[{ label: "Recruitment", to: "/vagas" }, { label: "People", to: "/pessoas" }, { label: "Onboarding", to: "/onboarding" }].map((s) => (
              <Chip key={s.to} label={`→ ${s.label}`} size="small" onClick={() => navigate(s.to)} sx={{ bgcolor: "#E7F2EA", color: "primary.main", fontWeight: 700, "&:hover": { bgcolor: "secondary.light" } }} />
            ))}
          </Stack>
        </PanelCard>

        <PanelCard title="My Week" icon={<CalendarMonthRoundedIcon fontSize="small" />}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            {(["today", "week", "pending"] as const).map((d) => (
              <Chip
                key={d}
                label={d === "today" ? "Hoje" : d === "week" ? "Semana" : "Pendentes"}
                size="small"
                onClick={() => setActiveDay(d)}
                sx={{
                  fontWeight: 700,
                  bgcolor: activeDay === d ? "primary.main" : "#E7F2EA",
                  color: activeDay === d ? "#fff" : "text.secondary",
                  "&:hover": { bgcolor: activeDay === d ? "primary.dark" : "secondary.light" },
                }}
              />
            ))}
          </Stack>
          <Stack spacing={1}>
            {filteredTasks.map((t) => (
              <Stack key={t.id} direction="row" spacing={1.25} alignItems="flex-start" sx={{ cursor: "pointer" }} onClick={() => toggleTask(t.id)}>
                <Box
                  sx={{
                    width: 16, height: 16, borderRadius: "5px", mt: 0.3, flexShrink: 0,
                    border: "2px solid", borderColor: t.done ? "primary.main" : "divider",
                    bgcolor: t.done ? "primary.main" : "transparent",
                    display: "grid", placeItems: "center", color: "#fff", fontSize: 11,
                  }}
                >
                  {t.done ? "✓" : ""}
                </Box>
                <Typography variant="body2" sx={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? "text.secondary" : "text.primary" }}>
                  {t.text}
                </Typography>
              </Stack>
            ))}
            {filteredTasks.length === 0 && <Typography variant="body2" color="text.secondary" fontStyle="italic">Tudo feito! 🎉</Typography>}
          </Stack>
        </PanelCard>

        <PanelCard title="KPI Summary" icon={<TrendingUpRoundedIcon fontSize="small" />}>
          <KpiGroup label="Recruitment" items={[
            { k: "Vagas abertas", v: String(openVacancies.length) },
            { k: "Candidatos ativos", v: String(activeCandidates) },
          ]} />
          <KpiGroup label="People" items={[
            { k: "Headcount", v: String(activeEmployees.length) },
            { k: "Em onboarding", v: String(activeOnboardings.length) },
          ]} />
          <KpiGroup label="Business" items={[
            { k: "Pipeline Consulting", v: `${leads.length} leads` },
            { k: "Clientes", v: String(clients.length) },
          ]} />
        </PanelCard>
      </Box>

      <PanelCard
        title="HR Insights"
        icon={<LightbulbRoundedIcon fontSize="small" />}
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeRoundedIcon fontSize="small" />}
            onClick={handleGenerateInsights}
            disabled={generateInsights.isPending}
          >
            {generateInsights.isPending ? "Gerando…" : "Gerar com IA"}
          </Button>
        }
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(4, 1fr)" }, gap: 1.5 }}>
          {recentInsights.map((insight) => {
            const style = INSIGHT_STYLE[insight.type];
            return (
              <Box key={insight.id} sx={{ borderRadius: 3, p: 1.75, bgcolor: style.bg, border: "1px solid", borderColor: style.border }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {style.icon} {style.label}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{insight.text}</Typography>
              </Box>
            );
          })}
          {recentInsights.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ gridColumn: "1 / -1" }}>
              Nenhum insight ainda — clique em "Gerar com IA" ou adicione um manualmente na página Insights.
            </Typography>
          )}
        </Box>
      </PanelCard>
    </Box>
  );
}

function StatCard({ label, value, sub, color, light }: { label: string; value?: number; sub: string; color: string; light?: boolean }) {
  return (
    <Box sx={{ borderRadius: 4, p: 2.25, bgcolor: color }}>
      <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.06em", color: light ? "rgba(255,255,255,.8)" : "text.secondary" }}>
        {label}
      </Typography>
      {value === undefined ? (
        <Skeleton width={40} height={40} sx={{ bgcolor: alpha("#000", 0.08) }} />
      ) : (
        <Typography sx={{ fontSize: 30, fontWeight: 800, color: light ? "#fff" : "text.primary", lineHeight: 1.2, mt: 0.25 }}>{value}</Typography>
      )}
      <Typography variant="caption" sx={{ color: light ? "rgba(255,255,255,.75)" : "text.secondary" }}>{sub}</Typography>
    </Box>
  );
}

function PanelCard({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.75 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
          <Typography fontWeight={800} fontSize={15}>{title}</Typography>
        </Stack>
        {action}
      </Stack>
      <Stack spacing={1.1}>{children}</Stack>
    </Box>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{value}</Typography>
    </Stack>
  );
}

function KpiGroup({ label, items }: { label: string; items: { k: string; v: string }[] }) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Typography>
      <Stack spacing={0.4} sx={{ mt: 0.4 }}>
        {items.map((i) => (
          <Stack key={i.k} direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">{i.k}</Typography>
            <Typography variant="body2" fontWeight={700}>{i.v}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
