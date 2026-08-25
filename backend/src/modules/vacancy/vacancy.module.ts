import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Vacancy, VacancySchema } from "./schemas/vacancy.schema";
import { Application, ApplicationSchema } from "../application/schemas/application.schema";
import { VacancyController } from "./vacancy.controller";
import { VacancyService } from "./vacancy.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vacancy.name, schema: VacancySchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
    AiModule,
  ],
  controllers: [VacancyController],
  providers: [VacancyService],
  exports: [VacancyService],
})
export class VacancyModule {}
