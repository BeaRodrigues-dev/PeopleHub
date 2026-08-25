import * as Joi from "joi";

/**
 * Schema de validação das variáveis de ambiente. Falha rápido (erro no boot)
 * se algo obrigatório estiver faltando ou com formato inválido — evita
 * comportamento silenciosamente errado em produção.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(3001),
  CORS_ORIGIN: Joi.string().default("http://localhost:5173"),
  MONGODB_URI: Joi.string().required(),
  OPENAI_API_KEY: Joi.string().allow("").optional(),
  OPENAI_MODEL: Joi.string().default("gpt-4o-mini"),
  UPLOAD_DIR: Joi.string().default("./uploads"),
  UPLOAD_MAX_SIZE_MB: Joi.number().default(5),
});

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  mongodbUri: string;
  openaiApiKey?: string;
  openaiModel: string;
  uploadDir: string;
  uploadMaxSizeBytes: number;
}

export default (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3001),
    corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim()),
    mongodbUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/talentflow",
    openaiApiKey: process.env.OPENAI_API_KEY || undefined,
    openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
    uploadMaxSizeBytes: Number(process.env.UPLOAD_MAX_SIZE_MB ?? 5) * 1024 * 1024,
  },
});
