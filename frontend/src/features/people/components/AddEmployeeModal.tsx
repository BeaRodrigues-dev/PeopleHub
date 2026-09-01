import { useEffect, useState } from "react";
import { Box, Button, Grid, MenuItem, TextField } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateEmployee, useUpdateEmployee } from "../queries";
import { CONTRACT_TYPES, EMPLOYEE_STATUSES, LIFECYCLE_STAGES, type CreateEmployeeInput, type Employee, type EmployeeStatus } from "../types";

const empty: CreateEmployeeInput = {
  name: "",
  role: "",
  area: "",
  country: "",
  startDate: new Date().toISOString().slice(0, 10),
  manager: "",
  contract: "Tiempo completo",
  status: "Activo",
  lifecycle: "Onboarding",
  exitDate: "",
  exitReason: "",
};

export function AddEmployeeModal({ open, onClose, employee }: { open: boolean; onClose: () => void; employee?: Employee | null }) {
  const isEditing = !!employee;
  const [form, setForm] = useState<CreateEmployeeInput>(empty);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(
        employee
          ? { name: employee.name, role: employee.role, area: employee.area, country: employee.country, startDate: employee.startDate, manager: employee.manager ?? "", contract: employee.contract, status: employee.status, lifecycle: employee.lifecycle, exitDate: employee.exitDate ?? "", exitReason: employee.exitReason ?? "" }
          : empty,
      );
    }
  }, [open, employee]);

  const isSaving = createEmployee.isPending || updateEmployee.isPending;
  const set = <K extends keyof CreateEmployeeInput>(key: K, value: CreateEmployeeInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Al cambiar el status sugerimos la fecha de hoy como salida (si todavía
  // no hay una cargada), pero la fecha queda 100% editable a mano después:
  // no la volvemos a pisar en cada guardado. Si vuelve a "Activo" limpiamos
  // fecha y motivo.
  const handleStatusChange = (value: EmployeeStatus) => {
    setForm((f) => {
      if (value === "Activo") return { ...f, status: value, exitDate: "", exitReason: "" };
      return { ...f, status: value, exitDate: f.exitDate || new Date().toISOString().slice(0, 10) };
    });
  };

  const handleClose = () => {
    setForm(empty);
    onClose();
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Completa el nombre y el cargo.");
      return;
    }
    if (isEditing && employee) {
      updateEmployee.mutate(
        { id: employee.id, input: form },
        {
          onSuccess: () => { toast.success("Colaborador actualizado."); handleClose(); },
          onError: (error) => toast.error(errorMessage(error, "No se pudieron guardar los cambios.")),
        },
      );
      return;
    }
    createEmployee.mutate(form, {
      onSuccess: () => {
        toast.success("Colaborador agregado.");
        handleClose();
      },
      onError: (error) => toast.error(errorMessage(error, "No fue posible agregar al colaborador.")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar colaborador" : "Agregar colaborador"}
      width={560}
      footer={
        <>
          <Button variant="text" onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar"}
          </Button>
        </>
      }
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField label="Nombre" fullWidth size="small" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Grid>
        <Grid size={6}>
          <TextField label="Cargo" fullWidth size="small" value={form.role} onChange={(e) => set("role", e.target.value)} />
        </Grid>
        <Grid size={6}>
          <TextField label="Área" fullWidth size="small" value={form.area} onChange={(e) => set("area", e.target.value)} />
        </Grid>
        <Grid size={6}>
          <TextField label="País" fullWidth size="small" value={form.country} onChange={(e) => set("country", e.target.value)} />
        </Grid>
        <Grid size={6}>
          <TextField label="Fecha de ingreso" type="date" fullWidth size="small" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={6}>
          <TextField label="Manager" fullWidth size="small" value={form.manager} onChange={(e) => set("manager", e.target.value)} />
        </Grid>
        <Grid size={6}>
          <TextField select label="Contrato" fullWidth size="small" value={form.contract} onChange={(e) => set("contract", e.target.value)}>
            {CONTRACT_TYPES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={6}>
          <TextField select label="Status" fullWidth size="small" value={form.status} onChange={(e) => handleStatusChange(e.target.value as EmployeeStatus)}>
            {EMPLOYEE_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={6}>
          <TextField select label="Fase (lifecycle)" fullWidth size="small" value={form.lifecycle} onChange={(e) => set("lifecycle", e.target.value as CreateEmployeeInput["lifecycle"])}>
            {LIFECYCLE_STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Grid>
        {form.status !== "Activo" && (
          <>
            <Grid size={6}>
              <TextField
                label="Fecha de salida"
                type="date"
                fullWidth
                size="small"
                value={form.exitDate ?? ""}
                onChange={(e) => set("exitDate", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Motivo de salida"
                placeholder="Ej. Renuncia, fin de contrato, despido…"
                fullWidth
                size="small"
                value={form.exitReason ?? ""}
                onChange={(e) => set("exitReason", e.target.value)}
              />
            </Grid>
          </>
        )}
      </Grid>
      <Box sx={{ height: 4 }} />
    </Modal>
  );
}
