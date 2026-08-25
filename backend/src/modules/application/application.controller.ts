import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApplicationService } from "./application.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { MoveStageDto } from "./dto/move-stage.dto";
import { UpdateApplicationStatusDto } from "./dto/update-status.dto";
import { QueryApplicationDto } from "./dto/query-application.dto";

@ApiTags("applications")
@Controller("applications")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({ summary: "Vincular candidato a uma vaga" })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar candidaturas (filtrar por candidato e/ou vaga)" })
  findAll(@Query() query: QueryApplicationDto) {
    return this.applicationService.findAll(query, { populateCandidate: query.populate === "candidate" });
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe da candidatura" })
  findOne(@Param("id") id: string) {
    return this.applicationService.findById(id);
  }

  @Patch(":id/stage")
  @ApiOperation({ summary: "Mover candidato entre etapas do pipeline" })
  moveStage(@Param("id") id: string, @Body() dto: MoveStageDto) {
    return this.applicationService.moveStage(id, dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Alterar status da candidatura" })
  updateStatus(@Param("id") id: string, @Body() dto: UpdateApplicationStatusDto) {
    return this.applicationService.updateStatus(id, dto);
  }

  @Post(":id/evaluate")
  @ApiOperation({ summary: "Calcular aderência candidato x vaga via IA e salvar o resultado" })
  evaluate(@Param("id") id: string) {
    return this.applicationService.evaluate(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover candidatura (candidato volta ao Banco de Talentos se era a vaga atual)" })
  remove(@Param("id") id: string) {
    return this.applicationService.remove(id);
  }
}
