import { useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tab, Tooltip, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { useConsultingLeads, useConsultingServices, useDeleteConsultingLead, useQualifyLeadWithAi } from "../queries";
import { AddConsultingLeadModal } from "../components/AddConsultingLeadModal";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { errorMessage } from "../../../components/common/ErrorState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/ToastProvider";
import type { ConsultingLead } from "../types";

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  "Pesquisado": { bg: "#E4EDE6", fg: "#6E7D74" },
  "Proposta enviada": { bg: "#E3ECFA", fg: "#2E5AA8" },
  "Reunião agendada": { bg: "#DCEFE1", fg: "#2E6B4F" },
  "Em negociação": { bg: "#FBEBD2", fg: "#A66A1E" },
  "Cliente": { bg: "#DCEFE1", fg: "#2E7D4F" },
};

const PRIORITY_COLOR: Record<string, { bg: string; fg: string }> = {
  Alta: { bg: "#FDE2E2", fg: "#B23A3A" },
  Média: { bg: "#FBEBD2", fg: "#A66A1E" },
  Baixa: { bg: "#E4EDE6", fg: "#6E7D74" },
};

export function ConsultingPage() {
  const [tab, setTab] = useState<"pipeline" | "services" | "bd">("pipeline");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ConsultingLead | null>(null);
  const [toDelete, setToDelete] = useState<ConsultingLead | null>(null);
  const { data, isLoading, isError, error, refetch } = useConsultingLeads();
  const leads = data?.items ?? [];
  const { data: services } = useConsultingServices();
  const qualify = useQualifyLeadWithAi();
  const deleteLead = useDeleteConsultingLead();
  const toast = useToast();

  const handleDelete = () => {
    if (!toDelete) return;
    deleteLead.mutate(toDelete.id, {
      onSuccess: () => { toast.success("Empresa removida."); setToDelete(null); },
      onError: (err) => toast.error(errorMessage(err, "Não foi possível remover.")),
    });
  };

  const bdStats = [
    { label: "Pesquisadas", count: leads.filter((l) => l.status === "Pesquisado").length },
    { label: "Contactadas", count: leads.filter((l) => l.status === "Proposta enviada").length },
    { label: "Reuniões", count: leads.filter((l) => l.status === "Reunião agendada").length },
    { label: "Negociação", count: leads.filter((l) => l.status === "Em negociação").length },
    { label: "Clientes", count: leads.filter((l) => l.status === "Cliente").length },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">HR Consulting Business</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Transforma o teu RH numa fonte de receita</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Nova empresa</Button>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Tab value="pipeline" label="🏢 Pipeline" sx={{ textTransform: "none", fontWeight: 700 }} />
        <Tab value="services" label="💼 Serviços" sx={{ textTransform: "none", fontWeight: 700 }} />
        <Tab value="bd" label="📈 Business Dev" sx={{ textTransform: "none", fontWeight: 700 }} />
      </Tabs>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton variant="rounded" height={320} />
      ) : tab === "pipeline" ? (
        leads.length === 0 ? (
          <EmptyState icon={<BusinessCenterRoundedIcon />} title="Nenhuma empresa no pipeline" description="Adicione a primeira empresa para começar a acompanhar oportunidades." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Nova empresa</Button>} />
        ) : (
          <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F1F7F2" }}>
                  {["Empresa", "Setor", "Dimensão", "Contacto", "Necessidade", "Status", "Valor", "IA", ""].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={700}>{lead.company}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{lead.sector}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{lead.size}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{lead.contact}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{lead.need}</Typography></TableCell>
                    <TableCell><Chip label={lead.status} size="small" sx={{ bgcolor: STATUS_COLOR[lead.status]?.bg, color: STATUS_COLOR[lead.status]?.fg, fontWeight: 700 }} /></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700} color="primary.main">{lead.value}</Typography></TableCell>
                    <TableCell>
                      {lead.aiQualification ? (
                        <Tooltip title={`${lead.aiQualification.reasoning} Próximo passo: ${lead.aiQualification.suggestedNextStep}`}>
                          <Chip label={lead.aiQualification.priority} size="small" sx={{ bgcolor: PRIORITY_COLOR[lead.aiQualification.priority]?.bg, color: PRIORITY_COLOR[lead.aiQualification.priority]?.fg, fontWeight: 700 }} />
                        </Tooltip>
                      ) : (
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<AutoAwesomeRoundedIcon fontSize="small" />}
                          disabled={qualify.isPending}
                          onClick={() => qualify.mutate(lead.id, { onError: (error) => toast.error(errorMessage(error, "Não foi possível qualificar.")) })}
                        >
                          Qualificar
                        </Button>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setEditing(lead)}><EditRoundedIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setToDelete(lead)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )
      ) : tab === "services" ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(3, 1fr)" }, gap: 2 }}>
          {(services ?? []).map((s) => (
            <Box key={s.id} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
              <Typography fontSize={26}>{s.icon}</Typography>
              <Typography fontWeight={800} sx={{ mt: 1 }}>{s.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>{s.desc}</Typography>
              <Box sx={{ pt: 1.25, borderTop: "1px solid", borderColor: "#E4EDE6" }}>
                <Typography variant="caption" color="text.secondary">Pricing</Typography>
                <Typography fontWeight={700} color="primary.main">{s.price}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 2.5 }}>
            {bdStats.map((s) => (
              <Box key={s.label} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2, textAlign: "center" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase" }}>{s.label}</Typography>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: "primary.main" }}>{s.count}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
            <Typography fontWeight={800} sx={{ mb: 1.5 }}>Distribuição por status</Typography>
            <Stack spacing={1}>
              {Object.entries(STATUS_COLOR).map(([status, color]) => {
                const count = leads.filter((l) => l.status === status).length;
                const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
                return (
                  <Stack key={status} direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 150, flexShrink: 0 }}>{status}</Typography>
                    <Box sx={{ flex: 1, height: 8, bgcolor: "#E4EDE6", borderRadius: 4, overflow: "hidden" }}>
                      <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: color.fg }} />
                    </Box>
                    <Typography variant="caption" fontWeight={700} sx={{ width: 32, textAlign: "right" }}>{count}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        </Box>
      )}

      <AddConsultingLeadModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddConsultingLeadModal open={!!editing} onClose={() => setEditing(null)} lead={editing} />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir empresa"
        description={`Tem certeza que deseja excluir "${toDelete?.company}" do pipeline? Essa ação não pode ser desfeita.`}
        loading={deleteLead.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
