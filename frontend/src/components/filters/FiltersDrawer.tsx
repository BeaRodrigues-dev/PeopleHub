import { Button, FormControl, FormLabel, Stack, Typography } from "@mui/material";
import { SidePanel } from "../common/SidePanel";
import { SkillsEditor } from "../common/SkillsEditor";
import { useUIStore } from "../../store/uiStore";

/**
 * Drawer de filtros — usa o SidePanel (Portal, z-index próprio, scroll
 * interno independente). Corrige os bugs do drawer anterior: nunca fica
 * detrás del header, no corta contenido, funciona igual en mobile/desktop.
 */
export function FiltersDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const filters = useUIStore((s) => s.filters);
  const setFilters = useUIStore((s) => s.setFilters);
  const clearFilters = useUIStore((s) => s.clearFilters);

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Filtros"
      subtitle="Refina tu búsqueda de talentos"
      width={400}
      footer={
        <Stack direction="row" gap={1.5}>
          <Button fullWidth onClick={() => { clearFilters(); }}>Limpiar</Button>
          <Button fullWidth variant="contained" onClick={onClose}>Aplicar filtros</Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <FormControl fullWidth>
          <FormLabel sx={{ fontSize: 13, fontWeight: 750, color: "text.primary", mb: 1 }}>Ubicación</FormLabel>
          <SkillsEditor
            skills={filters.locations}
            onChange={(locations) => setFilters({ ...filters, locations })}
            placeholder="Agregar ubicación y presionar Enter"
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabel sx={{ fontSize: 13, fontWeight: 750, color: "text.primary", mb: 1 }}>Competencias</FormLabel>
          <SkillsEditor
            skills={filters.skills}
            onChange={(skills) => setFilters({ ...filters, skills })}
            placeholder="Agregar competencia y presionar Enter"
          />
        </FormControl>
        {(filters.locations.length > 0 || filters.skills.length > 0) && (
          <Typography variant="caption" color="text.secondary">
            {filters.locations.length + filters.skills.length} filtro(s) activo(s).
          </Typography>
        )}
      </Stack>
    </SidePanel>
  );
}
