import { ApiProperty } from "@nestjs/swagger";
import { Candidate } from "../../candidate/schemas/candidate.schema";

export class TalentBankMatchDto {
  @ApiProperty() candidate: Candidate & { id: string };
  @ApiProperty() score: number;
  @ApiProperty({ type: [String] }) matchingSkills: string[];
  @ApiProperty({ type: [String] }) missingSkills: string[];
  @ApiProperty({ required: false }) recommendation?: string;
  @ApiProperty({ required: false }) reasoning?: string;
}
