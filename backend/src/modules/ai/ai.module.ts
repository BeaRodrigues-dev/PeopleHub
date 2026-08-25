import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AI_PROVIDER } from "./ai.constants";
import { AiService } from "./ai.service";
import { OpenAiProvider } from "./providers/openai.provider";
import { MockAiProvider } from "./providers/mock-ai.provider";
import type { AppConfig } from "../../config/configuration";

@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const { openaiApiKey, openaiModel } = config.get<AppConfig>("app")!;
        return openaiApiKey ? new OpenAiProvider(openaiApiKey, openaiModel) : new MockAiProvider();
      },
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
