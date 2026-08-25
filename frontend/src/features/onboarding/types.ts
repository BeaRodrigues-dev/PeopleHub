export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface OnboardingChecklist {
  before: ChecklistItem[];
  day1: ChecklistItem[];
  week1: ChecklistItem[];
}

export const ONBOARDING_STATUSES = ["Started", "In Progress", "Completed"] as const;
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
    { label: "Contrato assinado", done: false },
    { label: "Acessos criados (email, Slack, ferramentas)", done: false },
    { label: "Equipamento preparado", done: false },
    { label: "Welcome email enviado", done: false },
  ],
  day1: [
    { label: "Welcome meeting com HR", done: false },
    { label: "Apresentação à equipa", done: false },
    { label: "Tour cultura & valores", done: false },
    { label: "Setup ferramentas", done: false },
  ],
  week1: [
    { label: "Follow-up 1:1 com manager", done: false },
    { label: "Feedback do novo colaborador", done: false },
    { label: "30-day plan alinhado", done: false },
  ],
};

export interface CreateOnboardingInput {
  employeeName: string;
  role: string;
  startDate: string;
  checklist?: OnboardingChecklist;
}

export type ChecklistPhase = keyof OnboardingChecklist;
