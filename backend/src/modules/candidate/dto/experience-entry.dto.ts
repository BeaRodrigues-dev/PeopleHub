import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ExperienceEntryDto {
  @ApiProperty()
  @IsString()
  company: string;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class EducationEntryDto {
  @ApiProperty()
  @IsString()
  institution: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endYear?: string;
}
