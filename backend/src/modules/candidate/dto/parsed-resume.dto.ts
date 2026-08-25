import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EducationEntryDto, ExperienceEntryDto } from "./experience-entry.dto";

/** Formato estruturado retornado pela IA a partir do texto do currículo. */
export class ParsedResumeDto {
  @ApiProperty() name: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() location?: string;
  @ApiProperty({ type: [String] }) skills: string[];
  @ApiProperty({ type: [ExperienceEntryDto] }) experience: ExperienceEntryDto[];
  @ApiProperty({ type: [EducationEntryDto] }) education: EducationEntryDto[];
  @ApiPropertyOptional() seniority?: string;
  @ApiProperty({ type: [String] }) languages: string[];
  @ApiPropertyOptional() linkedin?: string;
  @ApiPropertyOptional() portfolio?: string;
}

/** Resposta de POST /candidates/resume/parse — usada pela tela "Confirmar candidato". */
export class ResumeParseResponseDto {
  @ApiProperty({ type: ParsedResumeDto })
  extracted: ParsedResumeDto;

  @ApiProperty({ description: "URL pública do arquivo salvo (/uploads/...)" })
  resumeUrl: string;

  @ApiProperty({ description: "Texto bruto extraído do arquivo" })
  resumeText: string;
}
