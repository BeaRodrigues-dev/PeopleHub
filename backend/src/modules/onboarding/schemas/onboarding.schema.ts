import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const ONBOARDING_STATUSES = ["Started", "In Progress", "Completed"] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

@Schema({ _id: false })
export class ChecklistItem {
  @Prop({ required: true })
  label: string;

  @Prop({ default: false })
  done: boolean;
}
export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

@Schema({ _id: false })
export class OnboardingChecklist {
  @Prop({ type: [ChecklistItemSchema], default: [] })
  before: ChecklistItem[];

  @Prop({ type: [ChecklistItemSchema], default: [] })
  day1: ChecklistItem[];

  @Prop({ type: [ChecklistItemSchema], default: [] })
  week1: ChecklistItem[];
}
export const OnboardingChecklistSchema = SchemaFactory.createForClass(OnboardingChecklist);

export type OnboardingEntryDocument = OnboardingEntry & Document;

@Schema({
  timestamps: true,
  collection: "onboardings",
  toJSON: { virtuals: true, transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
})
export class OnboardingEntry {
  @Prop({ required: true })
  employeeName: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  startDate: string;

  @Prop({ enum: ONBOARDING_STATUSES, default: "Started" })
  status: OnboardingStatus;

  @Prop({ type: OnboardingChecklistSchema, required: true })
  checklist: OnboardingChecklist;

  @Prop({ type: Number, default: 0 })
  progress: number;
}

export const OnboardingEntrySchema = SchemaFactory.createForClass(OnboardingEntry);

export const DEFAULT_ONBOARDING_CHECKLIST: OnboardingChecklist = {
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

export function computeProgress(checklist: OnboardingChecklist): number {
  const all = [...checklist.before, ...checklist.day1, ...checklist.week1];
  return all.length ? Math.round((all.filter((i) => i.done).length / all.length) * 100) : 0;
}
