import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { INSIGHT_TYPES, type InsightType } from "../schemas/insight.schema";

export class CreateInsightDto {
  @ApiProperty({ enum: INSIGHT_TYPES })
  @IsEnum(INSIGHT_TYPES)
  type: InsightType;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;
}
