export const LIFECYCLE_STAGES = ["Recruitment", "Onboarding", "Development", "Performance", "Offboarding"] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const CONTRACT_TYPES = ["Full-time", "Part-time", "PJ / Contractor"] as const;
export const EMPLOYEE_STATUSES = ["Active", "Offboarding"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export interface Employee {
  id: string;
  name: string;
  role: string;
  area: string;
  country: string;
  startDate: string;
  manager?: string;
  contract: string;
  status: EmployeeStatus;
  lifecycle: LifecycleStage;
  createdAt: string;
  updatedAt: string;
}

export type CreateEmployeeInput = Omit<Employee, "id" | "createdAt" | "updatedAt">;
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;
