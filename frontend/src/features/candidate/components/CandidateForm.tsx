import type { ReactNode } from "react";
import { Grid, MenuItem, Select, TextField, Typography } from "@mui/material";
import { SkillsEditor } from "../../../components/common/SkillsEditor";
import { SENIORITIES } from "../../vacancy/types";

export interface CandidateFormValues {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  seniority: string;
  linkedin: string;
  portfolio: string;
  notes: string;
}

export const emptyCandidateForm: CandidateFormValues = {
  name: "",
  email: "",
  phone: "",
  location: "",
  skills: [],
  seniority: "Semi Senior",
  linkedin: "",
  portfolio: "",
  notes: "",
};

export function isCandidateFormValid(values: CandidateFormValues): boolean {
  return Boolean(values.name.trim() && values.email.trim());
}

/**
 * Formulário de candidato — componente controlado, reaproveitado por 3
 * flujos: edición, creación manual y confirmación después de la extracción del currículum
 * via IA. Evita duplicar a mesma lógica de campos em três lugares.
 */
export function CandidateForm({
  values,
  onChange,
  extraContent,
}: {
  values: CandidateFormValues;
  onChange: (values: CandidateFormValues) => void;
  extraContent?: ReactNode;
}) {
  const patch = (p: Partial<CandidateFormValues>) => onChange({ ...values, ...p });

  return (
    <>
      {extraContent}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Nombre" fullWidth size="small" required value={values.name} onChange={(e) => patch({ name: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Email" type="email" fullWidth size="small" required value={values.email} onChange={(e) => patch({ email: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Teléfono" fullWidth size="small" value={values.phone} onChange={(e) => patch({ phone: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Ubicación" fullWidth size="small" value={values.location} onChange={(e) => patch({ location: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>Nivel de experiencia</Typography>
          <Select fullWidth size="small" value={values.seniority} onChange={(e) => patch({ seniority: e.target.value })}>
            {SENIORITIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="LinkedIn" fullWidth size="small" value={values.linkedin} onChange={(e) => patch({ linkedin: e.target.value })} />
        </Grid>
        <Grid size={12}>
          <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>Competencias</Typography>
          <SkillsEditor skills={values.skills} onChange={(skills) => patch({ skills })} />
        </Grid>
        <Grid size={12}>
          <TextField label="Observaciones" fullWidth multiline minRows={3} size="small" value={values.notes} onChange={(e) => patch({ notes: e.target.value })} />
        </Grid>
      </Grid>
    </>
  );
}
