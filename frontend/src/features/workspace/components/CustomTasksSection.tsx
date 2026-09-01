import { useState } from "react";
import { Box, Chip, Checkbox, IconButton, InputAdornment, Skeleton, Stack, TextField, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useCreateCustomTask, useCustomTasks, useDeleteCustomTask, useToggleCustomTask } from "../queries";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { useToast } from "../../../components/common/ToastProvider";
import { WORKSPACE_CATEGORIES, type WorkspaceCategory } from "../types";

const CATEGORY_COLOR: Record<string, { bg: string; fg: string }> = {
  Empresa: { bg: "#E3ECFA", fg: "#2E5AA8" },
  Personal: { bg: "#DCEFE1", fg: "#2E7D4F" },
};

export function CustomTasksSection() {
  const { data: tasks, isLoading, isError, error, refetch } = useCustomTasks();
  const createTask = useCreateCustomTask();
  const toggleTask = useToggleCustomTask();
  const deleteTask = useDeleteCustomTask();
  const toast = useToast();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<WorkspaceCategory>("Personal");
  const [filter, setFilter] = useState<"all" | WorkspaceCategory>("all");

  const items = (tasks ?? []).filter((t) => filter === "all" || t.category === filter);

  const handleAdd = () => {
    const value = text.trim();
    if (!value) return;
    createTask.mutate(
      { text: value, category },
      {
        onSuccess: () => setText(""),
        onError: (err) => toast.error(errorMessage(err, "No fue posible agregar la tarea.")),
      },
    );
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography fontWeight={800} fontSize={17}>✅ Tus tareas</Typography>
          <Typography variant="body2" color="text.secondary">Pendientes de la empresa o personales — agrega, marca y elimina libremente.</Typography>
        </Box>
        <ToggleButtonGroup exclusive size="small" value={filter} onChange={(_, v) => v && setFilter(v)}>
          <ToggleButton value="all" sx={{ px: 1.5, textTransform: "none", fontWeight: 700 }}>Todas</ToggleButton>
          {WORKSPACE_CATEGORIES.map((c) => (
            <ToggleButton key={c} value={c} sx={{ px: 1.5, textTransform: "none", fontWeight: 700 }}>{c}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Escribe una tarea y presiona Enter…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <ToggleButtonGroup exclusive size="small" value={category} onChange={(_, v) => v && setCategory(v)}>
                    {WORKSPACE_CATEGORIES.map((c) => (
                      <ToggleButton key={c} value={c} sx={{ px: 1, py: 0.25, fontSize: 11, textTransform: "none", fontWeight: 700 }}>{c}</ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </InputAdornment>
              ),
            },
          }}
        />
        <IconButton onClick={handleAdd} disabled={!text.trim() || createTask.isPending} sx={{ bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } }}>
          <AddRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Stack spacing={1}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={36} />)}</Stack>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">Ninguna tarea por aquí todavía.</Typography>
      ) : (
        <Stack spacing={0.75}>
          {items.map((task) => (
            <Stack
              key={task.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5, px: 1, py: 0.4 }}
            >
              <Checkbox
                size="small"
                checked={task.done}
                onChange={() => toggleTask.mutate({ id: task.id, done: !task.done })}
              />
              <Typography variant="body2" sx={{ flex: 1, textDecoration: task.done ? "line-through" : "none", color: task.done ? "text.secondary" : "text.primary" }}>
                {task.text}
              </Typography>
              <Chip label={task.category} size="small" sx={{ bgcolor: (CATEGORY_COLOR[task.category] ?? CATEGORY_COLOR.Personal).bg, color: (CATEGORY_COLOR[task.category] ?? CATEGORY_COLOR.Personal).fg, fontWeight: 700, height: 20 }} />
              <IconButton size="small" onClick={() => deleteTask.mutate(task.id)}>
                <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
