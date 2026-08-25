import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const INSIGHT_TYPES = ["problem", "opportunity", "suggestion"] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];

export const INSIGHT_SOURCES = ["manual", "ai"] as const;
export type InsightSource = (typeof INSIGHT_SOURCES)[number];

export type InsightDocument = Insight & Document;

@Schema({
  timestamps: true,
  collection: "insights",
  toJSON: { virtuals: true, transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
})
export class Insight {
  @Prop({ enum: INSIGHT_TYPES, required: true, index: true })
  type: InsightType;

  @Prop({ required: true })
  text: string;

  @Prop({ default: "" })
  area?: string;

  @Prop({ enum: INSIGHT_SOURCES, default: "manual" })
  source: InsightSource;

  @Prop({ required: true })
  date: string;
}

export const InsightSchema = SchemaFactory.createForClass(Insight);
