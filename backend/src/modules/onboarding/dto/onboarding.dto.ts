import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class ChecklistItemDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

export class OnboardingChecklistDto {
  @ApiProperty({ type: [ChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  before: ChecklistItemDto[];

  @ApiProperty({ type: [ChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  day1: ChecklistItemDto[];

  @ApiProperty({ type: [ChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  week1: ChecklistItemDto[];
}

export class CreateOnboardingDto {
  @ApiProperty()
  @IsString()
  employeeName: string;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ type: OnboardingChecklistDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OnboardingChecklistDto)
  checklist?: OnboardingChecklistDto;
}

export class ToggleChecklistItemDto {
  @ApiProperty({ enum: ["before", "day1", "week1"] })
  @IsIn(["before", "day1", "week1"])
  phase: "before" | "day1" | "week1";

  @ApiProperty()
  @IsInt()
  @Min(0)
  index: number;
}

export class SuggestChecklistDto {
  @ApiProperty()
  @IsString()
  role: string;
}
