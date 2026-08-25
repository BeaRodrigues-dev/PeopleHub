import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConsultingLead, ConsultingLeadSchema } from "./schemas/consulting-lead.schema";
import { ConsultingController } from "./consulting.controller";
import { ConsultingService } from "./consulting.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [MongooseModule.forFeature([{ name: ConsultingLead.name, schema: ConsultingLeadSchema }]), AiModule],
  controllers: [ConsultingController],
  providers: [ConsultingService],
  exports: [ConsultingService],
})
export class ConsultingModule {}
