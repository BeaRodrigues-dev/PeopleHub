import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export const APPLICATION_STATUSES = ["ACTIVE", "REJECTED", "HIRED", "WITHDRAWN"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

@Schema({ _id: false })
export class AiEvaluation {
  @Prop({ required: true })
  matchScore: number;

  @Prop({ type: [String], default: [] })
  strengths: string[];

  @Prop({ type: [String], default: [] })
  missingSkills: string[];

  @Prop()
  recommendation?: string;

  @Prop()
  reasoning?: string;

  @Prop({ default: () => new Date() })
  evaluatedAt: Date;

  @Prop()
  provider?: string;
}
export const AiEvaluationSchema = SchemaFactory.createForClass(AiEvaluation);

export type ApplicationDocument = Application & Document;

/**
 * Entidade intermediária candidato x vaga. Um candidato pode ter uma
 * Application por vaga (índice único abaixo evita duplicidade); o histórico
 * de etapa/status/avaliação de IA de cada candidatura vive aqui, mesmo que a
 * UI hoje só mostre a vaga "ativa" do candidato (Candidate.vacancyId).
 */
@Schema({
  timestamps: true,
  collection: "applications",
  toJSON: { virtuals: true, transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
})
export class Application {
  @Prop({ type: Types.ObjectId, ref: "Candidate", required: true, index: true })
  candidateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Vacancy", required: true, index: true })
  vacancyId: Types.ObjectId;

  /** Nome da etapa atual (deve corresponder a um stage.name do pipeline da vaga). */
  @Prop({ required: true })
  currentStage: string;

  @Prop({ type: Number, default: null })
  matchScore?: number | null;

  @Prop({ enum: APPLICATION_STATUSES, default: "ACTIVE" })
  status: ApplicationStatus;

  @Prop({ type: AiEvaluationSchema, default: null })
  aiEvaluation?: AiEvaluation | null;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
ApplicationSchema.index({ candidateId: 1, vacancyId: 1 }, { unique: true });
