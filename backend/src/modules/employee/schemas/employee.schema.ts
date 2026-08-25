import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const LIFECYCLE_STAGES = ["Recruitment", "Onboarding", "Development", "Performance", "Offboarding"] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const EMPLOYEE_STATUSES = ["Active", "Offboarding"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export type EmployeeDocument = Employee & Document;

@Schema({
  timestamps: true,
  collection: "employees",
  toJSON: { virtuals: true, transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
})
export class Employee {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true })
  role: string;

  @Prop({ default: "" })
  area?: string;

  @Prop({ default: "" })
  country?: string;

  @Prop({ required: true })
  startDate: string;

  @Prop({ default: "" })
  manager?: string;

  @Prop({ default: "Full-time" })
  contract: string;

  @Prop({ enum: EMPLOYEE_STATUSES, default: "Active" })
  status: EmployeeStatus;

  @Prop({ enum: LIFECYCLE_STAGES, default: "Onboarding", index: true })
  lifecycle: LifecycleStage;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
EmployeeSchema.index({ name: "text", role: "text", area: "text" });
