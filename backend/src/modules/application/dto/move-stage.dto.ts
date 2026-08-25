import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class MoveStageDto {
  @ApiProperty({ description: "Nome da etapa de destino (deve existir no pipeline da vaga)" })
  @IsString()
  stage: string;
}
