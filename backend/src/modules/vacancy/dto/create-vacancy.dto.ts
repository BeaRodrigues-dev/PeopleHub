import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { PipelineStageDto } from "./pipeline-stage.dto";
import { VACANCY_STATUSES, WORK_MODELS, type VacancyStatus, type WorkModel } from "../schemas/vacancy.schema";

export class CreateVacancyDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibilities?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: WORK_MODELS })
  @IsOptional()
  @IsEnum(WORK_MODELS)
  workModel?: WorkModel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seniority?: string;

  @ApiPropertyOptional({ enum: VACANCY_STATUSES })
  @IsOptional()
  @IsEnum(VACANCY_STATUSES)
  status?: VacancyStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ type: [PipelineStageDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PipelineStageDto)
  stages?: PipelineStageDto[];
}
