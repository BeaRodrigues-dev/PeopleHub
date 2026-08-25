import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { EMPLOYEE_STATUSES, LIFECYCLE_STAGES, type EmployeeStatus, type LifecycleStage } from "../schemas/employee.schema";

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manager?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contract?: string;

  @ApiPropertyOptional({ enum: EMPLOYEE_STATUSES })
  @IsOptional()
  @IsEnum(EMPLOYEE_STATUSES)
  status?: EmployeeStatus;

  @ApiPropertyOptional({ enum: LIFECYCLE_STAGES })
  @IsOptional()
  @IsEnum(LIFECYCLE_STAGES)
  lifecycle?: LifecycleStage;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}

export class QueryEmployeeDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LIFECYCLE_STAGES })
  @IsOptional()
  @IsEnum(LIFECYCLE_STAGES)
  lifecycle?: LifecycleStage;
}
