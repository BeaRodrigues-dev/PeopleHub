import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { APPLICATION_STATUSES, type ApplicationStatus } from "../schemas/application.schema";

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: APPLICATION_STATUSES })
  @IsEnum(APPLICATION_STATUSES)
  status: ApplicationStatus;
}
