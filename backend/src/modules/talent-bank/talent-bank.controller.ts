import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { TalentBankService } from "./talent-bank.service";
import { QueryCandidateDto } from "../candidate/dto/query-candidate.dto";
import { AssignToVacancyDto } from "./dto/assign-to-vacancy.dto";

@ApiTags("talent-bank")
@Controller("talent-bank")
export class TalentBankController {
  constructor(private readonly talentBankService: TalentBankService) {}

  @Get()
  @ApiOperation({ summary: "Listar candidatos sem vaga (Banco de Talentos)" })
  list(@Query() query: QueryCandidateDto) {
    return this.talentBankService.list(query);
  }

  @Get("match/:vacancyId")
  @ApiOperation({ summary: "Sugerir candidatos compatíveis com a vaga (ranking rápido por skills)" })
  match(@Param("vacancyId") vacancyId: string) {
    return this.talentBankService.matchForVacancy(vacancyId);
  }

  @Post("match/:vacancyId/ai")
  @ApiOperation({ summary: "Reforçar o ranking com avaliação de IA (mais lento, avalia os melhores colocados)" })
  matchWithAi(@Param("vacancyId") vacancyId: string) {
    return this.talentBankService.matchForVacancyWithAi(vacancyId);
  }

  @Post("assign")
  @ApiOperation({ summary: "Adicionar candidatos do Banco de Talentos a uma vaga" })
  assign(@Body() dto: AssignToVacancyDto) {
    return this.talentBankService.assign(dto);
  }
}
