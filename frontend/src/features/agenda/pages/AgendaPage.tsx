import { useMemo, useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import { useAgendaEvents, useDeleteAgendaEvent } from "../queries";
import { AddEventModal } from "../components/AddEventModal";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/ToastProvider";
import type { AgendaEvent } from "../types";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const CATEGORY_COLOR: Record<string, { bg: string; fg: string }> = {
  Personal: { bg: "#E3F2E8", fg: "#5F9678" },
  Empresa: { bg: "#E7E3F5", fg: "#8B7FBF" },
};

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthGrid(monthStart: Date): Date[] {
  const firstWeekday = (monthStart.getDay() + 6) % 7; // lunes=0
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - firstWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function AgendaPage() {
  const { data: events, isLoading, isError, error, refetch } = useAgendaEvents();
  const deleteEvent = useDeleteAgendaEvent();
  const toast = useToast();
  const today = useMemo(() => new Date(), []);
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => toISODate(today));
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaEvent | null>(null);
  const [toDelete, setToDelete] = useState<AgendaEvent | null>(null);

  const allEvents = events ?? [];
  const eventsByDate = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    for (const e of allEvents) {
      (map[e.eventDate] ??= []).push(e);
    }
    return map;
  }, [allEvents]);

  const gridDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const todayISO = toISODate(today);
  const selectedEvents = (eventsByDate[selectedDate] ?? []).sort((a, b) => (a.eventTime ?? "").localeCompare(b.eventTime ?? ""));

  const goToMonth = (delta: number) => setMonthCursor((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const handleDelete = () => {
    if (!toDelete) return;
    deleteEvent.mutate(toDelete.id, {
      onSuccess: () => { toast.success("Evento eliminado."); setToDelete(null); },
      onError: (err) => toast.error(errorMessage(err, "No fue posible eliminar.")),
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1300, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Agenda</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Tu segunda agenda de People — anota fechas, recordatorios y compromisos, 100% editable.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Nuevo evento</Button>
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton variant="rounded" height={520} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2.5 }}>
          <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography fontWeight={800} fontSize={16} sx={{ textTransform: "capitalize" }}>
                {monthCursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Button size="small" variant="text" onClick={() => { setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(todayISO); }}>Hoy</Button>
                <IconButton size="small" onClick={() => goToMonth(-1)}><ChevronLeftRoundedIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => goToMonth(1)}><ChevronRightRoundedIcon fontSize="small" /></IconButton>
              </Stack>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75, mb: 0.5 }}>
              {WEEKDAYS.map((w) => (
                <Typography key={w} variant="caption" fontWeight={800} color="text.secondary" textAlign="center" sx={{ textTransform: "uppercase" }}>{w}</Typography>
              ))}
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75 }}>
              {gridDays.map((day) => {
                const iso = toISODate(day);
                const inMonth = day.getMonth() === monthCursor.getMonth();
                const dayEvents = eventsByDate[iso] ?? [];
                const isSelected = iso === selectedDate;
                const isToday = iso === todayISO;
                return (
                  <Box
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    sx={{
                      minHeight: 74, borderRadius: 2.5, p: 0.75, cursor: "pointer",
                      border: "1px solid", borderColor: isSelected ? "primary.main" : "divider",
                      bgcolor: isSelected ? "#F1F7F2" : "background.paper",
                      opacity: inMonth ? 1 : 0.4,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={isToday ? 800 : 600}
                      sx={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 20, height: 20, borderRadius: "50%",
                        bgcolor: isToday ? "primary.main" : "transparent",
                        color: isToday ? "#fff" : "text.primary",
                      }}
                    >
                      {day.getDate()}
                    </Typography>
                    <Stack spacing={0.3} sx={{ mt: 0.4 }}>
                      {dayEvents.slice(0, 2).map((e) => (
                        <Box key={e.id} sx={{ fontSize: 10.5, fontWeight: 700, px: 0.6, py: 0.15, borderRadius: 1, bgcolor: CATEGORY_COLOR[e.category]?.bg, color: CATEGORY_COLOR[e.category]?.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.title}
                        </Box>
                      ))}
                      {dayEvents.length > 2 && (
                        <Typography variant="caption" color="text.secondary" fontSize={10}>+{dayEvents.length - 2} más</Typography>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography fontWeight={800} fontSize={14}>
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </Typography>
              <IconButton size="small" onClick={() => setAddOpen(true)}><AddRoundedIcon fontSize="small" /></IconButton>
            </Stack>
            {selectedEvents.length === 0 ? (
              <Stack alignItems="center" spacing={1} sx={{ py: 4, color: "text.secondary" }}>
                <EventRoundedIcon />
                <Typography variant="body2">Ningún evento para este día.</Typography>
              </Stack>
            ) : (
              <Stack spacing={1.25}>
                {selectedEvents.map((e) => (
                  <Box key={e.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Chip label={e.category} size="small" sx={{ bgcolor: CATEGORY_COLOR[e.category]?.bg, color: CATEGORY_COLOR[e.category]?.fg, fontWeight: 700, height: 20, mb: 0.5 }} />
                        <Typography fontWeight={700} fontSize={13.5}>{e.title}</Typography>
                        {e.eventTime && <Typography variant="caption" color="text.secondary">🕒 {e.eventTime}</Typography>}
                        {e.notes && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{e.notes}</Typography>}
                      </Box>
                      <Stack direction="row" spacing={0.25}>
                        <IconButton size="small" onClick={() => setEditing(e)}><EditRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
                        <IconButton size="small" onClick={() => setToDelete(e)}><DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      )}

      <AddEventModal open={addOpen} onClose={() => setAddOpen(false)} defaultDate={selectedDate} />
      <AddEventModal open={!!editing} onClose={() => setEditing(null)} event={editing} />
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar evento"
        description={`¿Estás seguro de que deseas eliminar "${toDelete?.title}"? Esta acción no se puede deshacer.`}
        loading={deleteEvent.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
