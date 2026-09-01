import { useMemo, useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, TextField, Typography, alpha } from "@mui/material";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useNavigate } from "react-router-dom";
import { useAgendaEvents } from "../../agenda/queries";
import { useClimateRounds, useClimateResults } from "../../climate/queries";
import { useVacancies } from "../../vacancy/queries";
import { useVacancyCandidateCounts } from "../../candidate/queries";
import { useEmployees } from "../../people/queries";
import { useOnboardings } from "../../onboarding/queries";
import { useConsultingLeads } from "../../consulting/queries";
import { useInsights, useGenerateInsightsWithAi } from "../../insights/queries";
import { useTalentPool } from "../../talent-bank/queries";
import { useCustomTasks, useCreateCustomTask, useToggleCustomTask, useDeleteCustomTask } from "../../workspace/queries";
import { useUIStore } from "../../../store/uiStore";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";

const INSIGHT_STYLE: Record<string, { bg: string; border: string; label: string; icon: string }> = {
  problem: { bg: "#F5E3E8", border: "#E8D3D9", label: "Problema", icon: "🔴" },
  opportunity: { bg: "#E7E2FB", border: "#F1EEFD", label: "Oportunidad", icon: "🟡" },
  suggestion: { bg: "#E7E2FB", border: "#E7E2FB", label: "Sugerencia", icon: "🔵" },
};

type WeekBucket = "today" | "week" | "pending";

interface WeekItem {
  id: string;
  rawId: string;
  text: string;
  detail?: string;
  done: boolean;
  kind: "task" | "event";
  dueDate: string | null;
}

/** Ubica un ítem en Hoy / Semana / Pendientes comparando su fecha con hoy — sin bucket manual: vencidas y de hoy caen en "Hoy", hasta 7 días en "Semana", el resto (o sin fecha) en "Pendientes". */
function bucketFor(dueDate: string | null, todayISO: string, weekLimitISO: string): WeekBucket {
  if (!dueDate) return "pending";
  if (dueDate <= todayISO) return "today";
  if (dueDate <= weekLimitISO) return "week";
  return "pending";
}

function formatToday(): string {
  const text = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatEventDate(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Hoy";
  if (iso === tomorrow) return "Mañana";
  const text = new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const openAddCandidate = useUIStore((s) => s.openAddCandidate);
  const [activeDay, setActiveDay] = useState<WeekBucket>("today");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const { data: tasks } = useCustomTasks();
  const createTask = useCreateCustomTask();
  const toggleTask = useToggleCustomTask();
  const deleteTask = useDeleteCustomTask();

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
  const { data: agendaData } = useAgendaEvents();
  const { data: climateRounds } = useClimateRounds();
  const { data: climateResults } = useClimateResults();
  const generateInsights = useGenerateInsightsWithAi();

  const openVacancies = vacancies.filter((v) => v.status === "Abierta");
  const activeCandidates = Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0);
  const activeEmployees = employees.filter((e) => e.status === "Activo");
  const offboardingEmployees = employees.filter((e) => e.status === "Offboarding");
  const activeOnboardings = onboardings.filter((o) => o.status !== "Completado");
  const clients = leads.filter((l) => l.status === "Cliente");

  const todayISO = new Date().toISOString().slice(0, 10);
  const weekLimitISO = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  // "My Week" combina las tareas (custom_tasks, con fecha real y opcional) y
  // los eventos próximos de la Agenda, así lo que ya agendaste no hay que
  // volver a anotarlo como tarea — todo se ubica solo en Hoy/Semana/Pendientes
  // comparando la fecha contra hoy.
  const weekItems: WeekItem[] = useMemo(() => {
    const taskItems: WeekItem[] = (tasks ?? []).map((t) => ({ id: `task-${t.id}`, rawId: t.id, text: t.text, done: t.done, kind: "task", dueDate: t.dueDate }));
    const eventItems: WeekItem[] = (agendaData ?? [])
      .filter((e) => e.eventDate >= todayISO)
      .map((e) => ({ id: `event-${e.id}`, rawId: e.id, text: e.title, detail: e.eventTime ?? undefined, done: false, kind: "event", dueDate: e.eventDate }));
    return [...taskItems, ...eventItems];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, agendaData]);

  const filteredWeekItems = weekItems
    .filter((i) => bucketFor(i.dueDate, todayISO, weekLimitISO) === activeDay)
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));

  const handleAddTask = () => {
    const value = newTaskText.trim();
    if (!value) return;
    const dueDate = newTaskDate || (activeDay === "today" ? todayISO : null);
    createTask.mutate(
      { text: value, category: "Personal", dueDate },
      {
        onSuccess: () => { setNewTaskText(""); setNewTaskDate(""); },
        onError: (err) => toast.error(errorMessage(err, "No fue posible agregar la tarea.")),
      },
    );
  };

  const recentInsights = useMemo(() => insights.slice(0, 4), [insights]);

  const latestRound = climateRounds && climateRounds.length ? climateRounds[climateRounds.length - 1] : null;
  const latestRoundResults = (climateResults ?? []).filter((r) => r.roundId === latestRound?.id);
  const latestRoundAverage = latestRoundResults.length ? latestRoundResults.reduce((sum, r) => sum + r.score, 0) / latestRoundResults.length : null;

  const upcomingEvents = useMemo(
    () => (agendaData ?? []).filter((e) => e.eventDate >= todayISO).sort((a, b) => a.eventDate.localeCompare(b.eventDate) || (a.eventTime ?? "").localeCompare(b.eventTime ?? "")).slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agendaData],
  );

  const isLoading = vacanciesLoading || employeesLoading || onboardingsLoading;

  const handleGenerateInsights = () => {
    generateInsights.mutate(undefined, {
      onSuccess: (created) => toast.success(`${created.length} nuevo(s) insight(s) generado(s) con IA.`),
      onError: (error) => toast.error(errorMessage(error, "No se pudieron generar insights.")),
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {formatToday()}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.4 }}>Hola, Beatriz 👋</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>Aquí está tu resumen de People & HR para hoy.</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <StatCard label="Colaboradores" value={isLoading ? undefined : activeEmployees.length} sub={`${offboardingEmployees.length} en offboarding`} icon={<GroupsRoundedIcon fontSize="small" />} iconBg="#F1EEFD" iconColor="#6C5CE0" />
        <StatCard label="Vacantes abiertas" value={isLoading ? undefined : openVacancies.length} sub={`${vacancies.length} total`} icon={<WorkOutlineRoundedIcon fontSize="small" />} iconBg="#E1EAFE" iconColor="#4C7DE0" />
        <StatCard label="Candidatos activos" value={isLoading ? undefined : activeCandidates} sub="en pipelines de vacantes" icon={<PersonSearchRoundedIcon fontSize="small" />} iconBg="#DFF3EA" iconColor="#2FA36B" />
        <StatCard label="Pipeline Consulting" value={isLoading ? undefined : leads.length} sub={`${clients.length} cliente(s)`} icon={<HandshakeRoundedIcon fontSize="small" />} iconBg="#FDEBDD" iconColor="#E08A3C" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" }, gap: 2.5, mb: 3 }}>
        <PanelCard title="HR Overview" icon={<BarChartRoundedIcon fontSize="small" />}>
          <OverviewRow label="Onboardings activos" value={String(activeOnboardings.length)} />
          <OverviewRow label="Talentos en el pool" value={String(poolData?.total ?? 0)} />
          <OverviewRow label="Empresas en pipeline" value={String(leads.length)} />
          <OverviewRow label="Insights registrados" value={String(insights.length)} />
          <OverviewRow label="Rondas de clima" value={String(climateRounds?.length ?? 0)} />
          <OverviewRow label="Eventos en agenda" value={String(agendaData?.length ?? 0)} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 1.5, mt: 1, borderTop: "1px solid", borderColor: "divider" }}>
            {[
              { label: "Recruitment", to: "/vagas" },
              { label: "People", to: "/pessoas" },
              { label: "Onboarding", to: "/onboarding" },
              { label: "Clima", to: "/clima" },
              { label: "Agenda", to: "/agenda" },
            ].map((s) => (
              <Chip key={s.to} label={`→ ${s.label}`} size="small" onClick={() => navigate(s.to)} sx={{ bgcolor: "#F2F0FC", color: "primary.main", fontWeight: 700, "&:hover": { bgcolor: "secondary.light" } }} />
            ))}
          </Stack>
        </PanelCard>

        <PanelCard title="My Week" icon={<CalendarMonthRoundedIcon fontSize="small" />}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            {(["today", "week", "pending"] as const).map((d) => (
              <Chip
                key={d}
                label={d === "today" ? "Hoy" : d === "week" ? "Semana" : "Pendientes"}
                size="small"
                onClick={() => setActiveDay(d)}
                sx={{
                  fontWeight: 700,
                  bgcolor: activeDay === d ? "primary.main" : "#F2F0FC",
                  color: activeDay === d ? "#fff" : "text.secondary",
                  "&:hover": { bgcolor: activeDay === d ? "primary.dark" : "secondary.light" },
                }}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Agregar tarea…"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <TextField
              type="date"
              size="small"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              sx={{ width: 148, flexShrink: 0 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <IconButton onClick={handleAddTask} disabled={!newTaskText.trim() || createTask.isPending} sx={{ bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } }}>
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack spacing={1}>
            {filteredWeekItems.map((item) => {
              const isEvent = item.kind === "event";
              return (
                <Stack key={item.id} direction="row" spacing={1.25} alignItems="flex-start">
                  {isEvent ? (
                    <Box sx={{ width: 16, height: 16, mt: 0.3, flexShrink: 0, display: "grid", placeItems: "center", color: "primary.main" }}>
                      <EventRoundedIcon sx={{ fontSize: 15 }} />
                    </Box>
                  ) : (
                    <Box
                      onClick={() => toggleTask.mutate({ id: item.rawId, done: !item.done })}
                      sx={{
                        width: 16, height: 16, borderRadius: "5px", mt: 0.3, flexShrink: 0, cursor: "pointer",
                        border: "2px solid", borderColor: item.done ? "primary.main" : "divider",
                        bgcolor: item.done ? "primary.main" : "transparent",
                        display: "grid", placeItems: "center", color: "#fff", fontSize: 11,
                      }}
                    >
                      {item.done ? "✓" : ""}
                    </Box>
                  )}
                  <Typography
                    variant="body2"
                    onClick={isEvent ? () => navigate("/agenda") : () => toggleTask.mutate({ id: item.rawId, done: !item.done })}
                    sx={{ flex: 1, cursor: "pointer", textDecoration: item.done ? "line-through" : "none", color: item.done ? "text.secondary" : "text.primary" }}
                  >
                    {item.text}{isEvent && item.detail ? ` · ${item.detail}` : ""}
                  </Typography>
                  {item.dueDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, mt: 0.15 }}>{formatEventDate(item.dueDate)}</Typography>
                  )}
                  {!isEvent && (
                    <IconButton size="small" onClick={() => deleteTask.mutate(item.rawId)}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  )}
                </Stack>
              );
            })}
            {filteredWeekItems.length === 0 && <Typography variant="body2" color="text.secondary" fontStyle="italic">¡Todo listo! 🎉</Typography>}
          </Stack>
        </PanelCard>

        <PanelCard title="KPI Summary" icon={<TrendingUpRoundedIcon fontSize="small" />}>
          <KpiGroup label="Recruitment" items={[
            { k: "Vacantes abiertas", v: String(openVacancies.length) },
            { k: "Candidatos activos", v: String(activeCandidates) },
          ]} />
          <KpiGroup label="People" items={[
            { k: "Headcount", v: String(activeEmployees.length) },
            { k: "En onboarding", v: String(activeOnboardings.length) },
          ]} />
          <KpiGroup label="Business" items={[
            { k: "Pipeline Consulting", v: `${leads.length} leads` },
            { k: "Clientes", v: String(clients.length) },
          ]} />
          <KpiGroup label="Clima" items={[
            { k: "Última ronda", v: latestRound ? latestRound.name : "—" },
            { k: "Promedio", v: latestRoundAverage !== null ? `${latestRoundAverage.toFixed(1)} / 10` : "—" },
          ]} />
        </PanelCard>
      </Box>

      <PanelCard title="Accesos rápidos" icon={<AddRoundedIcon fontSize="small" />}>
        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" size="small" startIcon={<AddRoundedIcon fontSize="small" />} onClick={() => navigate("/criar-vaga")}>Nueva vacante</Button>
          <Button variant="outlined" size="small" startIcon={<PersonAddAltRoundedIcon fontSize="small" />} onClick={() => openAddCandidate(null)}>Agregar candidato</Button>
          <Button variant="outlined" size="small" startIcon={<EventRoundedIcon fontSize="small" />} onClick={() => navigate("/agenda")}>Nuevo evento</Button>
          <Button variant="outlined" size="small" startIcon={<SummarizeRoundedIcon fontSize="small" />} onClick={() => navigate("/relatorio-semanal")}>Reporte semanal</Button>
          <Button variant="outlined" size="small" startIcon={<InsightsRoundedIcon fontSize="small" />} onClick={() => navigate("/analytics")}>Dashboard analytics</Button>
        </Stack>
      </PanelCard>

      <PanelCard
        title="Recordatorios"
        icon={<EventRoundedIcon fontSize="small" />}
        action={<Button size="small" variant="text" onClick={() => navigate("/agenda")}>Ver agenda →</Button>}
      >
        {upcomingEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">Ningún evento próximo. Agrega uno en la Agenda.</Typography>
        ) : (
          <Stack spacing={1}>
            {upcomingEvents.map((e) => (
              <Stack key={e.id} direction="row" alignItems="center" spacing={1.25}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: e.category === "Empresa" ? "#6C5CE0" : "#5646C4", flexShrink: 0 }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ width: 78, flexShrink: 0 }}>
                  {formatEventDate(e.eventDate)}
                </Typography>
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>{e.title}</Typography>
                {e.eventTime && <Typography variant="caption" color="text.secondary">{e.eventTime}</Typography>}
              </Stack>
            ))}
          </Stack>
        )}
      </PanelCard>

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
            {generateInsights.isPending ? "Generando…" : "Generar con IA"}
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
              Aún no hay insights — haz clic en "Generar con IA" o agrega uno manualmente en la página Insights.
            </Typography>
          )}
        </Box>
      </PanelCard>
    </Box>
  );
}

function StatCard({ label, value, sub, icon, iconBg, iconColor }: { label: string; value?: number; sub: string; icon: React.ReactNode; iconBg: string; iconColor: string }) {
  return (
    <Box sx={{ borderRadius: 4, p: 2.25, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2.5, bgcolor: iconBg, color: iconColor, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {icon}
        </Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </Typography>
      </Stack>
      {value === undefined ? (
        <Skeleton width={40} height={34} sx={{ bgcolor: alpha("#000", 0.06) }} />
      ) : (
        <Typography sx={{ fontSize: 28, fontWeight: 800, color: "text.primary", lineHeight: 1.2 }}>{value}</Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{sub}</Typography>
      <Sparkline color={iconColor} seed={(value ?? 0) + label.length} />
    </Box>
  );
}

/** Mini-gráfico decorativo (tendencia ilustrativa, no histórico real) para dar contexto visual rápido a cada stat card. */
function Sparkline({ color, seed }: { color: string; seed: number }) {
  const points = useMemo(() => {
    const arr: number[] = [];
    let v = 35 + (seed % 5) * 6;
    for (let i = 0; i < 10; i++) {
      v += Math.sin(i * 0.85 + seed * 0.4) * 9 + ((seed + i) % 3) - 1;
      arr.push(Math.max(8, Math.min(92, v)));
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  const w = 100;
  const h = 28;
  const stepX = w / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${(h - (p / 100) * h).toFixed(1)}`).join(" ");
  return (
    <Box component="svg" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" sx={{ display: "block" }}>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
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
