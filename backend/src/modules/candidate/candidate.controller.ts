import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Express } from "express";
import { CandidateService } from "./candidate.service";
import { ResumeParserService } from "./resume-parser.service";
import { AiService } from "../ai/ai.service";
import { CreateCandidateDto } from "./dto/create-candidate.dto";
import { UpdateCandidateDto } from "./dto/update-candidate.dto";
import { QueryCandidateDto } from "./dto/query-candidate.dto";
import { ResumeParseResponseDto } from "./dto/parsed-resume.dto";

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

@ApiTags("candidates")
@Controller("candidates")
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly resumeParser: ResumeParserService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar candidato (manual ou confirmado a partir de currículo)" })
  create(@Body() dto: CreateCandidateDto) {
    return this.candidateService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar candidatos (busca, filtros, paginação)" })
  findAll(@Query() query: QueryCandidateDto) {
    return this.candidateService.findAll(query);
  }

  @Get("counts-by-vacancy")
  @ApiOperation({ summary: "Contagem de candidatos por vaga (ids separados por vírgula)" })
  countsByVacancy(@Query("ids") ids: string) {
    const vacancyIds = (ids ?? "").split(",").filter(Boolean);
    return this.candidateService.countByVacancyIds(vacancyIds);
  }

  @Post("resume/parse")
  @ApiOperation({ summary: "Upload de currículo (PDF/DOCX): extrai texto + estrutura via IA, sem criar o candidato ainda" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async parseResume(@UploadedFile() file?: Express.Multer.File): Promise<ResumeParseResponseDto> {
    if (!file) throw new BadRequestException("Envie um arquivo de currículo (PDF ou DOCX).");
    if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Formato não suportado. Envie um currículo em PDF ou DOCX.");
    }

    const resumeText = await this.resumeParser.extractText(file.buffer, file.mimetype);
    if (!resumeText.trim()) {
      throw new BadRequestException("Não foi possível extrair texto do arquivo enviado.");
    }
    const [extracted, resumeUrl] = await Promise.all([
      this.aiService.extractResumeData(resumeText),
      this.resumeParser.saveFile(file.buffer, file.originalname),
    ]);

    return { extracted, resumeUrl, resumeText };
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe do candidato" })
  findOne(@Param("id") id: string) {
    return this.candidateService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar candidato" })
  update(@Param("id") id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidateService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover candidato" })
  remove(@Param("id") id: string) {
    return this.candidateService.remove(id);
  }
}
