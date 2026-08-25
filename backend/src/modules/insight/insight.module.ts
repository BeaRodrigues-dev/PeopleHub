import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Insight, InsightSchema } from "./schemas/insight.schema";
import { InsightController, AiInsightsController } from "./insight.controller";
import { InsightService } from "./insight.service";
import { AiModule } from "../ai/ai.module";
import { Vacancy, VacancySchema } from "../vacancy/schemas/vacancy.schema";
import { Application, ApplicationSchema } from "../application/schemas/application.schema";
import { Candidate, CandidateSchema } from "../candidate/schemas/candidate.schema";
import { Employee, EmployeeSchema } from "../employee/schemas/employee.schema";
import { OnboardingEntry, OnboardingEntrySchema } from "../onboarding/schemas/onboarding.schema";
import { ConsultingLead, ConsultingLeadSchema } from "../consulting/schemas/consulting-lead.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Insight.name, schema: InsightSchema },
      { name: Vacancy.name, schema: VacancySchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: OnboardingEntry.name, schema: OnboardingEntrySchema },
      { name: ConsultingLead.name, schema: ConsultingLeadSchema },
    ]),
    AiModule,
  ],
  controllers: [InsightController, AiInsightsController],
  providers: [InsightService],
  exports: [InsightService],
})
export class InsightModule {}
