import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBooleanString, IsMongoId, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryCandidateDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Filtrar por vaga específica" })
  @IsOptional()
  @IsMongoId()
  vacancyId?: string;

  @ApiPropertyOptional({ description: "true = somente Banco de Talentos (sem vaga)" })
  @IsOptional()
  @IsBooleanString()
  talentPoolOnly?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  locations?: string[];
}
