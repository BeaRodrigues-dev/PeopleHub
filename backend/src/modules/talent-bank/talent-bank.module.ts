import { Module } from "@nestjs/common";
import { TalentBankController } from "./talent-bank.controller";
import { TalentBankService } from "./talent-bank.service";
import { CandidateModule } from "../candidate/candidate.module";
import { VacancyModule } from "../vacancy/vacancy.module";
import { ApplicationModule } from "../application/application.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [CandidateModule, VacancyModule, ApplicationModule, AiModule],
  controllers: [TalentBankController],
  providers: [TalentBankService],
})
export class TalentBankModule {}
