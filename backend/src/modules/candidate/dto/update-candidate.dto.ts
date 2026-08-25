import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsMongoId, IsOptional, ValidateIf } from "class-validator";
import { CreateCandidateDto } from "./create-candidate.dto";

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {
  @ApiPropertyOptional({ description: "null remove o candidato da vaga (volta pro Banco de Talentos)", nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsMongoId()
  vacancyId?: string | null;
}
