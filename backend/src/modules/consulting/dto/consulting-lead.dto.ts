import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { CONSULTING_STATUSES, type ConsultingStatus } from "../schemas/consulting-lead.schema";

export class CreateConsultingLeadDto {
  @ApiProperty()
  @IsString()
  company: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  need?: string;

  @ApiPropertyOptional({ enum: CONSULTING_STATUSES })
  @IsOptional()
  @IsEnum(CONSULTING_STATUSES)
  status?: ConsultingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;
}

export class UpdateConsultingLeadDto extends PartialType(CreateConsultingLeadDto) {}
