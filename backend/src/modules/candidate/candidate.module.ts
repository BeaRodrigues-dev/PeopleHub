import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Candidate, CandidateSchema } from "./schemas/candidate.schema";
import { CandidateController } from "./candidate.controller";
import { CandidateService } from "./candidate.service";
import { ResumeParserService } from "./resume-parser.service";
import { AiModule } from "../ai/ai.module";
import type { AppConfig } from "../../config/configuration";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(), // precisamos do buffer em memória p/ extrair texto (pdf-parse/mammoth)
        limits: { fileSize: config.get<AppConfig>("app")!.uploadMaxSizeBytes },
      }),
    }),
    AiModule,
  ],
  controllers: [CandidateController],
  providers: [CandidateService, ResumeParserService],
  exports: [CandidateService],
})
export class CandidateModule {}
