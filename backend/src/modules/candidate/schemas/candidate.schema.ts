import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ _id: false })
export class ExperienceEntry {
  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  role: string;

  @Prop()
  startDate?: string;

  @Prop()
  endDate?: string;

  @Prop({ default: false })
  current?: boolean;

  @Prop()
  description?: string;
}
export const ExperienceEntrySchema = SchemaFactory.createForClass(ExperienceEntry);

@Schema({ _id: false })
export class EducationEntry {
  @Prop({ required: true })
  institution: string;

  @Prop()
  degree?: string;

  @Prop()
  fieldOfStudy?: string;

  @Prop()
  startYear?: string;

  @Prop()
  endYear?: string;
}
export const EducationEntrySchema = SchemaFactory.createForClass(EducationEntry);

export type CandidateDocument = Candidate & Document;

@Schema({
  timestamps: true,
  collection: "candidates",
  toJSON: { virtuals: true, transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
})
export class Candidate {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  location?: string;

  @Prop({ default: null })
  avatar?: string | null;

  /** Caminho público (servido em /uploads) do arquivo de currículo enviado. */
  @Prop({ default: null })
  resumeUrl?: string | null;

  /** Texto bruto extraído do currículo (PDF/DOCX) — reaproveitado por futuras avaliações de IA. */
  @Prop({ default: null })
  resumeText?: string | null;

  @Prop({ type: [ExperienceEntrySchema], default: [] })
  experience: ExperienceEntry[];

  @Prop({ type: [EducationEntrySchema], default: [] })
  education: EducationEntry[];

  @Prop({ type: [String], default: [], index: true })
  skills: string[];

  @Prop({ type: [String], default: [] })
  languages: string[];

  @Prop()
  seniority?: string;

  @Prop()
  linkedin?: string;

  @Prop()
  portfolio?: string;

  @Prop({ default: "" })
  notes?: string;

  /**
   * Vaga à qual o candidato está atualmente atribuído. `null` = Banco de
   * Talentos. O histórico detalhado de cada candidatura (etapa, status,
   * aderência calculada por IA) vive em Application — este campo é apenas o
   * atalho "vaga atual" usado pela UI e pelo filtro do banco de talentos.
   */
  @Prop({ type: Types.ObjectId, ref: "Vacancy", default: null, index: true })
  vacancyId?: Types.ObjectId | null;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);
CandidateSchema.index({ name: "text", email: "text", skills: "text" });
