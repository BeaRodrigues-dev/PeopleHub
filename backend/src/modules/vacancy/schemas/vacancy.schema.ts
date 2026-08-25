import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export const WORK_MODELS = ["Presencial", "Híbrido", "Remoto"] as const;
export type WorkModel = (typeof WORK_MODELS)[number];

export const VACANCY_STATUSES = ["Aberta", "Pausada", "Fechada", "Rascunho"] as const;
export type VacancyStatus = (typeof VACANCY_STATUSES)[number];

@Schema({ _id: true, toJSON: { virtuals: true } })
export class PipelineStage {
  _id?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  order: number;

  @Prop({ default: false })
  isTerminal?: boolean;
}
export const PipelineStageSchema = SchemaFactory.createForClass(PipelineStage);

export const DEFAULT_STAGES: Array<Pick<PipelineStage, "name" | "order" | "isTerminal">> = [
  { name: "Candidatura", order: 0, isTerminal: false },
  { name: "Triagem", order: 1, isTerminal: false },
  { name: "Entrevista RH", order: 2, isTerminal: false },
  { name: "Entrevista Técnica", order: 3, isTerminal: false },
  { name: "Oferta", order: 4, isTerminal: false },
  { name: "Contratado", order: 5, isTerminal: true },
];

export type VacancyDocument = Vacancy & Document;

@Schema({
  timestamps: true,
  collection: "vacancies",
  toJSON: { virtuals: true, transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
})
export class Vacancy {
  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ default: "" })
  description?: string;

  @Prop()
  responsibilities?: string;

  @Prop()
  requirements?: string;

  @Prop()
  department?: string;

  @Prop()
  location?: string;

  @Prop({ enum: WORK_MODELS, default: "Híbrido" })
  workModel: WorkModel;

  @Prop()
  seniority?: string;

  @Prop({ enum: VACANCY_STATUSES, default: "Aberta", index: true })
  status: VacancyStatus;

  @Prop({ type: [String], default: [], index: true })
  requiredSkills: string[];

  @Prop({ type: [PipelineStageSchema], default: DEFAULT_STAGES })
  stages: PipelineStage[];
}

export const VacancySchema = SchemaFactory.createForClass(Vacancy);
VacancySchema.index({ title: "text", department: "text", location: "text" });
