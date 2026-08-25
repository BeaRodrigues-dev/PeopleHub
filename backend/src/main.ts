import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { join } from "path";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import type { AppConfig } from "./config/configuration";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["log", "warn", "error"],
  });

  const config = app.get(ConfigService).get<AppConfig>("app")!;

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não declarados nos DTOs
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({ origin: config.corsOrigins, credentials: true });

  // Arquivos de currículo enviados ficam acessíveis em /uploads/<arquivo>
  app.useStaticAssets(join(process.cwd(), config.uploadDir), { prefix: "/uploads/" });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("TalentFlow API")
    .setDescription(
      "API do TalentFlow — ATS SaaS. Módulos: candidatos, vagas, applications (pipeline), banco de talentos e IA (extração de currículo + match).",
    )
    .setVersion("1.0")
    .addTag("candidates")
    .addTag("vacancies")
    .addTag("applications")
    .addTag("talent-bank")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(config.port);
  // eslint-disable-next-line no-console
  console.log(`🚀 TalentFlow API rodando em http://localhost:${config.port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`📘 Swagger em http://localhost:${config.port}/api/docs`);
}

void bootstrap();
