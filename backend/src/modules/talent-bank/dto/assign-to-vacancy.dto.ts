import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsMongoId } from "class-validator";

export class AssignToVacancyDto {
  @ApiProperty({ type: [String], description: "Ids dos candidatos do Banco de Talentos a atribuir" })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  candidateIds: string[];

  @ApiProperty()
  @IsMongoId()
  vacancyId: string;
}
