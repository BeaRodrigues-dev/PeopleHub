import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { Modal } from "../../../components/common/Modal";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { useToast } from "../../../components/common/ToastProvider";
import { useUIStore } from "../../../store/uiStore";
import { useVacancy } from "../../vacancy/queries";
import { useTalentBankMatch, useTalentBankMatchWithAi, useAssignFromTalentBank } from "../queries";
import type { TalentBankMatch } from "../types";

function matchColor(percent: number) {
  if (percent >= 70) return "#1c8a54";
  if (percent >= 40) return "#a8681a";
  return "#b3455a";
}

/**
 * Seleção inteligente de candidatos do Banco de Talentos — compara as
 * competências da vaga com as de cada candidato do pool. Por padrão usa um
 * ranking rápido (local, sem custo de IA); o botão "Reforçar com IA" chama
 * o endpoint que avalia os melhores colocados com o AiService de verdade.
 */
export function TalentBankMatchModal() {
  const vacancyId = useUIStore((s) => s.matchModalVacancyId);
  const close = useUIStore((s) => s.closeMatchModal);
  const toast = useToast();
  const { data: vacancy } = useVacancy(vacancyId);
  const { data: matches, isLoading, isError, error, refetch } = useTalentBankMatch(vacancyId);
  const matchWithAi = useTalentBankMatchWithAi();
  const assign = useAssignFromTalentBank();

  const [aiResults, setAiResults] = useState<TalentBankMatch[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const results = aiResults ?? matches ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => r.candidate.name.toLowerCase().includes(q) || r.candidate.skills.some((s) => s.toLowerCase().includes(q)));
  }, [results, search]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleAiRefine = () => {
    if (!vacancyId) return;
    matchWithAi.mutate(vacancyId, {
      onSuccess: (data) => setAiResults(data),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Falha ao avaliar candidatos com IA"),
    });
  };

  const handleAssign = () => {
    if (!vacancyId || selected.size === 0) return;
    assign.mutate(
      { candidateIds: Array.from(selected), vacancyId },
      {
        onSuccess: () => {
          toast.success(`${selected.size} candidato(s) adicionado(s) à vaga`);
          handleClose();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Falha ao adicionar candidatos"),
      },
    );
  };

  const handleClose = () => {
    setSelected(new Set());
    setAiResults(null);
    setSearch("");
    close();
  };

  return (
    <Modal
      open={!!vacancyId}
      onClose={handleClose}
      title="Adicionar candidatos do Banco de Talentos"
      subtitle={vacancy ? `Compatibilidade com as competências de "${vacancy.title}"` : undefined}
      width={720}
      footer={
        <>
          <Button startIcon={<AutoAwesomeRoundedIcon />} onClick={handleAiRefine} disabled={matchWithAi.isPending || !results.length}>
            {matchWithAi.isPending ? "Avaliando com IA…" : "Reforçar com IA"}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose} disabled={assign.isPending}>Cancelar</Button>
          <Button variant="contained" disabled={selected.size === 0 || assign.isPending} onClick={handleAssign}>
            {assign.isPending ? "Adicionando…" : `Adicionar ${selected.size || ""} candidato${selected.size === 1 ? "" : "s"}`.trim()}
          </Button>
        </>
      }
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar por nome ou competência…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{ input: { startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} /> } }}
        sx={{ mb: 2.5 }}
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress size={26} />
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<SearchRoundedIcon />} title="Nenhum candidato encontrado" description="Ajuste a busca ou cadastre novos candidatos no Banco de Talentos." />
      ) : (
        <Stack spacing={1.25}>
          {filtered.map(({ candidate, score, matchingSkills, missingSkills, reasoning }) => (
            <Box
              key={candidate.id}
              onClick={() => toggle(candidate.id)}
              sx={{
                display: "flex",
                gap: 1.5,
                p: 1.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: selected.has(candidate.id) ? "primary.main" : "divider",
                bgcolor: selected.has(candidate.id) ? "action.hover" : "background.paper",
                cursor: "pointer",
                transition: "border-color .15s ease, background .15s ease",
              }}
            >
              <Checkbox checked={selected.has(candidate.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggle(candidate.id)} sx={{ p: 0.5, alignSelf: "flex-start", mt: 0.25 }} />
              <Avatar src={candidate.avatar ?? undefined} sx={{ width: 42, height: 42 }}>{candidate.name[0]}</Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Typography fontWeight={750} fontSize={14} noWrap>{candidate.name}</Typography>
                  <Typography fontWeight={800} fontSize={13} sx={{ color: matchColor(score), flexShrink: 0 }}>Match: {score}%</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={score}
                  sx={{ height: 5, borderRadius: 3, my: 0.75, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: matchColor(score), borderRadius: 3 } }}
                />
                <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 0.5 }}>
                  {matchingSkills.map((skill) => (
                    <Chip key={skill} size="small" icon={<CheckRoundedIcon sx={{ fontSize: 13 }} />} label={skill} sx={{ height: 21, fontSize: 10.5, fontWeight: 650, bgcolor: "#e7f7ee", color: "#1c8a54" }} />
                  ))}
                  {missingSkills.map((skill) => (
                    <Chip key={skill} size="small" icon={<CloseRoundedIcon sx={{ fontSize: 13 }} />} label={skill} sx={{ height: 21, fontSize: 10.5, fontWeight: 650, bgcolor: "#fbe9ec", color: "#b3455a" }} />
                  ))}
                </Stack>
                {reasoning && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{reasoning}</Typography>}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Modal>
  );
}
