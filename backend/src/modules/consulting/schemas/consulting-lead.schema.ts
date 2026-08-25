import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const CONSULTING_STATUSES = ["Pesquisado", "Proposta enviada", "Reunião agendada", "Em negociação", "Cliente"] as const;
export type ConsultingStatus = (typeof CONSULTING_STATUSES)[number];

@Schema({ _id: false })
export class AiQualification {
  @Prop({ required: true })
  priority: "Alta" | "Média" | "Baixa";

  @Prop()
  reasoning?: string;

  @Prop()
  suggestedNextStep?: string;

  @Prop({ default: () => new Date() })
  evaluatedAt: Date;
}
export const AiQualificationSchema = SchemaFactory.createForClass(AiQualification);

export type ConsultingLeadDocument = ConsultingLead & Document;

@Schema({
  timestamps: true,
  collection: "consulting_leads",
  toJSON: { virtuals: true, transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
})
export class ConsultingLead {
  @Prop({ required: true, trim: true, index: true })
  company: string;

  @Prop({ default: "" })
  sector?: string;

  @Prop({ default: "" })
  size?: string;

  @Prop({ default: "" })
  contact?: string;

  @Prop({ default: "" })
  need?: string;

  @Prop({ enum: CONSULTING_STATUSES, default: "Pesquisado", index: true })
  status: ConsultingStatus;

  @Prop({ default: "—" })
  value: string;

  @Prop({ type: AiQualificationSchema, default: null })
  aiQualification?: AiQualification | null;
}

export const ConsultingLeadSchema = SchemaFactory.createForClass(ConsultingLead);
