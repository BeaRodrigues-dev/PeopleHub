import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { extname, join } from "path";
import { mkdir, writeFile } from "fs/promises";
import * as mammoth from "mammoth";
import type { AppConfig } from "../../config/configuration";

// pdf-parse não tem tipos ESM/default amigáveis — require dinâmico evita
// problemas de interop e mantém o serviço simples de testar/mockar.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse");

/** Extrai texto bruto de currículos em PDF ou DOCX e persiste o arquivo original. */
@Injectable()
export class ResumeParserService {
  constructor(private readonly configService: ConfigService) {}

  async extractText(buffer: Buffer, mimetype: string): Promise<string> {
    if (mimetype === "application/pdf") {
      const result = await pdfParse(buffer);
      return this.normalize(result.text);
    }
    if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return this.normalize(result.value);
    }
    throw new BadRequestException("Formato de arquivo não suportado. Envie um currículo em PDF ou DOCX.");
  }

  /** Persiste o arquivo original em disco (UPLOAD_DIR) e retorna a URL pública servida pelo Express. */
  async saveFile(buffer: Buffer, originalName: string): Promise<string> {
    const { uploadDir } = this.configService.get<AppConfig>("app")!;
    await mkdir(uploadDir, { recursive: true });
    const filename = `${randomUUID()}${extname(originalName) || ""}`;
    await writeFile(join(uploadDir, filename), buffer);
    return `/uploads/${filename}`;
  }

  private normalize(text: string): string {
    return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
}
