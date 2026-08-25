import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Application, ApplicationSchema } from "./schemas/application.schema";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./application.service";
import { CandidateModule } from "../candidate/candidate.module";
import { VacancyModule } from "../vacancy/vacancy.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
    CandidateModule,
    VacancyModule,
    AiModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
