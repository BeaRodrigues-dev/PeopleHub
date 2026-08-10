import {
  Drawer,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { STATUSES, type Filters } from "../../types/candidate";
import { useFilters } from "../../hooks/useFilters";
const seniorities = ["Júnior", "Pleno", "Sênior", "Especialista"];
const locations = [
  "São Paulo, SP",
  "Remoto",
  "Rio de Janeiro, RJ",
  "Curitiba, PR",
  "Belo Horizonte, MG",
];
function OptionGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <FormControl>
      <FormLabel
        sx={{ fontSize: 13, fontWeight: 750, color: "text.primary", mb: 1 }}
      >
        {title}
      </FormLabel>
      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        {options.map((v) => (
          <Chip
            key={v}
            label={v}
            onClick={() => onToggle(v)}
            color={selected.includes(v) ? "primary" : "default"}
            variant={selected.includes(v) ? "filled" : "outlined"}
            size="small"
            sx={{ fontWeight: 650 }}
          />
        ))}
      </Stack>
    </FormControl>
  );
}
export function FiltersDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { filters, update, clear } = useFilters();
  const patch = (p: Partial<Filters>) => update({ ...filters, ...p });
  const toggle = (key: "statuses" | "seniorities" | "locations", v: string) =>
    patch({
      [key]: filters[key].includes(v as never)
        ? filters[key].filter((x) => x !== v)
        : [...filters[key], v],
    } as Partial<Filters>);
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 400 }, p: 3 } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6">Filtros</Typography>
          <Typography variant="caption" color="text.secondary">
            Refine sua busca de talentos
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ ml: "auto" }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>
      <Stack spacing={3}>
        <OptionGroup
          title="Status"
          options={[...STATUSES]}
          selected={filters.statuses}
          onToggle={(v) => toggle("statuses", v)}
        />
        <Divider />
        <OptionGroup
          title="Senioridade"
          options={seniorities}
          selected={filters.seniorities}
          onToggle={(v) => toggle("seniorities", v)}
        />
        <Divider />
        <OptionGroup
          title="Localização"
          options={locations}
          selected={filters.locations}
          onToggle={(v) => toggle("locations", v)}
        />
        <Divider />
        <FormControl>
          <FormLabel
            sx={{ fontSize: 13, fontWeight: 750, color: "text.primary" }}
          >
            Pretensão salarial mensal
          </FormLabel>
          <Slider
            value={filters.salary}
            onChange={(_, value) =>
              patch({ salary: value as [number, number] })
            }
            min={0}
            max={30000}
            step={500}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `R$ ${v / 1000}k`}
            sx={{ mt: 2, mx: 1, width: "calc(100% - 16px)" }}
          />
          <Typography variant="caption" color="text.secondary">
            R$ {filters.salary[0].toLocaleString("pt-BR")} — R${" "}
            {filters.salary[1].toLocaleString("pt-BR")}
          </Typography>
        </FormControl>
        <TextField
          label="Candidatura a partir de"
          type="date"
          size="small"
          value={filters.appliedFrom}
          onChange={(e) => patch({ appliedFrom: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
      <Box sx={{ mt: "auto", display: "flex", gap: 1.5, pt: 3 }}>
        <Button fullWidth onClick={clear}>
          Limpar
        </Button>
        <Button fullWidth variant="contained" onClick={onClose}>
          Aplicar filtros
        </Button>
      </Box>
    </Drawer>
  );
}
