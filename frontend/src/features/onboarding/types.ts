export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface OnboardingChecklist {
  before: ChecklistItem[];
  day1: ChecklistItem[];
  week1: ChecklistItem[];
}

export const ONBOARDING_STATUSES = ["Iniciado", "En progreso", "Completado"] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export interface OnboardingEntry {
  id: string;
  employeeName: string;
  role: string;
  startDate: string;
  progress: number;
  status: OnboardingStatus;
  checklist: OnboardingChecklist;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CHECKLIST: OnboardingChecklist = {
  before: [
    { label: "Contrato firmado", done: false },
    { label: "Accesos creados (correo, Slack, herramientas)", done: false },
    { label: "Equipo preparado", done: false },
    { label: "Correo de bienvenida enviado", done: false },
  ],
  day1: [
    { label: "Reunión de bienvenida con RR. HH.", done: false },
    { label: "Presentación al equipo", done: false },
    { label: "Recorrido por cultura y valores", done: false },
    { label: "Configuración de herramientas", done: false },
  ],
  week1: [
    { label: "Seguimiento 1:1 con el manager", done: false },
    { label: "Feedback del nuevo colaborador", done: false },
    { label: "Plan de 30 días alineado", done: false },
  ],
};

export interface CreateOnboardingInput {
  employeeName: string;
  role: string;
  startDate: string;
  checklist?: OnboardingChecklist;
}

export type ChecklistPhase = keyof OnboardingChecklist;
