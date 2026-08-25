import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { VacancyService } from "./vacancy.service";
import { CreateVacancyDto } from "./dto/create-vacancy.dto";
import { UpdateVacancyDto } from "./dto/update-vacancy.dto";
import { QueryVacancyDto } from "./dto/query-vacancy.dto";

@ApiTags("vacancies")
@Controller("vacancies")
export class VacancyController {
  constructor(private readonly vacancyService: VacancyService) {}

  @Post()
  @ApiOperation({ summary: "Criar vaga" })
  create(@Body() dto: CreateVacancyDto) {
    return this.vacancyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar vagas" })
  findAll(@Query() query: QueryVacancyDto) {
    return this.vacancyService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe da vaga" })
  findOne(@Param("id") id: string) {
    return this.vacancyService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar vaga" })
  update(@Param("id") id: string, @Body() dto: UpdateVacancyDto) {
    return this.vacancyService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover vaga" })
  remove(@Param("id") id: string) {
    return this.vacancyService.remove(id);
  }

  @Get(":id/time-to-fill")
  @ApiOperation({ summary: "Previsão de time-to-fill (IA)" })
  timeToFill(@Param("id") id: string) {
    return this.vacancyService.predictTimeToFill(id);
  }
}
