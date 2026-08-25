import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OnboardingEntry, OnboardingEntrySchema } from "./schemas/onboarding.schema";
import { OnboardingController, OnboardingAiController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [MongooseModule.forFeature([{ name: OnboardingEntry.name, schema: OnboardingEntrySchema }]), AiModule],
  controllers: [OnboardingController, OnboardingAiController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
