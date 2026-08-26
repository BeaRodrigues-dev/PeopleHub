import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_GUARD } from "@nestjs/core";
import configuration, { envValidationSchema, type AppConfig } from "./config/configuration";
import { CandidateModule } from "./modules/candidate/candidate.module";
import { VacancyModule } from "./modules/vacancy/vacancy.module";
import { ApplicationModule } from "./modules/application/application.module";
import { TalentBankModule } from "./modules/talent-bank/talent-bank.module";
import { AiModule } from "./modules/ai/ai.module";
import { EmployeeModule } from "./modules/employee/employee.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { ConsultingModule } from "./modules/consulting/consulting.module";
import { InsightModule } from "./modules/insight/insight.module";
import { DocumentModule } from "./modules/document/document.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<AppConfig>("app")!.mongodbUri,
      }),
    }),
    AuthModule,
    AiModule,
    CandidateModule,
    VacancyModule,
    ApplicationModule,
    TalentBankModule,
    EmployeeModule,
    OnboardingModule,
    ConsultingModule,
    InsightModule,
    DocumentModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
