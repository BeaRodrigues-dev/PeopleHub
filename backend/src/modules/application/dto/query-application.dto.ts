import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsMongoId, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryApplicationDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  candidateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  vacancyId?: string;

  @ApiPropertyOptional({ description: "populate=candidate para trazer o candidato completo em cada item" })
  @IsOptional()
  @IsIn(["candidate"])
  populate?: "candidate";
}
