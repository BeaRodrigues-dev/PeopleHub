import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Express } from "express";
import { randomUUID } from "crypto";
import { extname, join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { ConfigService } from "@nestjs/config";
import { DocumentService } from "./document.service";
import { UploadDocumentMetaDto } from "./dto/document.dto";
import type { AppConfig } from "../../config/configuration";

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

@ApiTags("documents")
@Controller("documents")
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Listar documentos/manuais" })
  findAll() {
    return this.documentService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Enviar documento/manual (PDF ou DOCX)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() meta: UploadDocumentMetaDto) {
    if (!file) throw new BadRequestException("Envie um arquivo (PDF ou DOCX).");
    if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Formato não suportado. Envie um documento em PDF ou DOCX.");
    }
    const { uploadDir } = this.configService.get<AppConfig>("app")!;
    await mkdir(uploadDir, { recursive: true });
    const filename = `${randomUUID()}${extname(file.originalname) || ""}`;
    await writeFile(join(uploadDir, filename), file.buffer);

    return this.documentService.create({
      title: meta.title,
      category: meta.category || "Outro",
      description: meta.description,
      fileUrl: `/uploads/${filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover documento" })
  remove(@Param("id") id: string) {
    return this.documentService.remove(id);
  }
}
