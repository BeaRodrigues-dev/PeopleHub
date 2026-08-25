import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { VACANCY_STATUSES, type VacancyStatus } from "../schemas/vacancy.schema";

export class QueryVacancyDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VACANCY_STATUSES })
  @IsOptional()
  @IsEnum(VACANCY_STATUSES)
  status?: VacancyStatus;
}
