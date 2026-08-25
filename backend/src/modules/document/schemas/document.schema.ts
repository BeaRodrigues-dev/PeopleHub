import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document as MongoDocument } from "mongoose";

export const DOCUMENT_CATEGORIES = ["Políticas", "Benefícios", "Onboarding", "Cultura", "Compliance", "Outro"] as const;

export type HrDocumentDocument = HrDocument & MongoDocument;

@Schema({
  timestamps: true,
  collection: "documents",
  toJSON: { virtuals: true, transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
})
export class HrDocument {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: "Outro" })
  category: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ default: "Beatriz Rodrigues" })
  uploadedBy: string;
}

export const HrDocumentSchema = SchemaFactory.createForClass(HrDocument);
