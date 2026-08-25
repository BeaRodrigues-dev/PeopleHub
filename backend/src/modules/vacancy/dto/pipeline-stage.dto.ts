import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class PipelineStageDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  order: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;
}
