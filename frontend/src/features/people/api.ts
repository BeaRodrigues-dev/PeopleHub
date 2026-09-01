import { supabase, throwIfError } from "../../lib/supabaseClient";
import { paginate } from "../../lib/paginate";
import type { PaginatedResult } from "../../api/types";
import type { CreateEmployeeInput, Employee, EmployeeStatus, LifecycleStage, UpdateEmployeeInput } from "./types";

export interface EmployeeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  lifecycle?: string;
}

interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  area: string;
  country: string;
  start_date: string;
  manager: string | null;
  contract: string;
  status: string;
  lifecycle: string;
  exit_date: string | null;
  exit_reason: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    area: row.area,
    country: row.country,
    startDate: row.start_date,
    manager: row.manager ?? undefined,
    contract: row.contract,
    status: row.status as EmployeeStatus,
    lifecycle: row.lifecycle as LifecycleStage,
    exitDate: row.exit_date ?? null,
    exitReason: row.exit_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: Partial<CreateEmployeeInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.role !== undefined) row.role = input.role;
  if (input.area !== undefined) row.area = input.area;
  if (input.country !== undefined) row.country = input.country;
  if (input.startDate !== undefined) row.start_date = input.startDate;
  if (input.manager !== undefined) row.manager = input.manager;
  if (input.contract !== undefined) row.contract = input.contract;
  if (input.status !== undefined) {
    row.status = input.status;
    // Registra la fecha real de salida cuando el colaborador pasa a
    // "Offboarding" o "Inactivo" (para distinguir quién sigue activo de
    // quién ya salió) y la limpia si vuelve a estar "Activo".
    row.exit_date = input.status !== "Activo" ? new Date().toISOString().slice(0, 10) : null;
    if (input.status === "Activo") row.exit_reason = null;
  }
  if (input.lifecycle !== undefined) row.lifecycle = input.lifecycle;
  if (input.exitReason !== undefined) row.exit_reason = input.exitReason || null;
  return row;
}

export const peopleApi = {
  list: async (params: EmployeeQueryParams = {}): Promise<PaginatedResult<Employee>> => {
    let query = supabase.from("employees").select("*").order("created_at", { ascending: false });
    if (params.search) query = query.or(`name.ilike.%${params.search}%,role.ilike.%${params.search}%`);
    if (params.lifecycle) query = query.eq("lifecycle", params.lifecycle);
    const { data, error } = await query;
    throwIfError(error);
    return paginate((data as EmployeeRow[]).map(fromRow), params.page ?? 1, params.limit);
  },

  getById: async (id: string): Promise<Employee> => {
    const { data, error } = await supabase.from("employees").select("*").eq("id", id).single();
    throwIfError(error);
    return fromRow(data as EmployeeRow);
  },

  create: async (input: CreateEmployeeInput): Promise<Employee> => {
    const { data, error } = await supabase.from("employees").insert(toRow(input)).select("*").single();
    throwIfError(error);
    return fromRow(data as EmployeeRow);
  },

  update: async (id: string, input: UpdateEmployeeInput): Promise<Employee> => {
    const { data, error } = await supabase.from("employees").update(toRow(input)).eq("id", id).select("*").single();
    throwIfError(error);
    return fromRow(data as EmployeeRow);
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    throwIfError(error);
  },
};
