import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateApplicationDto {
  @ApiProperty()
  @IsMongoId()
  candidateId: string;

  @ApiProperty()
  @IsMongoId()
  vacancyId: string;

  @ApiPropertyOptional({ description: "Se omitido, usa a primeira etapa do pipeline da vaga" })
  @IsOptional()
  @IsString()
  currentStage?: string;
}
