import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { HrDocument, HrDocumentSchema } from "./schemas/document.schema";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import type { AppConfig } from "../../config/configuration";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HrDocument.name, schema: HrDocumentSchema }]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: { fileSize: config.get<AppConfig>("app")!.uploadMaxSizeBytes },
      }),
    }),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
