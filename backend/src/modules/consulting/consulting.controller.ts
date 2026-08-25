import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConsultingService } from "./consulting.service";
import { CreateConsultingLeadDto, UpdateConsultingLeadDto } from "./dto/consulting-lead.dto";

@ApiTags("consulting-leads")
@Controller("consulting-leads")
export class ConsultingController {
  constructor(private readonly consultingService: ConsultingService) {}

  @Get("services")
  @ApiOperation({ summary: "Catálogo de serviços de consultoria" })
  services() {
    return this.consultingService.services();
  }

  @Post()
  @ApiOperation({ summary: "Adicionar empresa ao pipeline de consulting" })
  create(@Body() dto: CreateConsultingLeadDto) {
    return this.consultingService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar pipeline de consulting" })
  findAll() {
    return this.consultingService.findAll();
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar empresa do pipeline" })
  update(@Param("id") id: string, @Body() dto: UpdateConsultingLeadDto) {
    return this.consultingService.update(id, dto);
  }

  @Post(":id/qualify")
  @ApiOperation({ summary: "Qualificar lead com IA (prioridade + próximo passo)" })
  qualify(@Param("id") id: string) {
    return this.consultingService.qualifyWithAi(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover empresa do pipeline" })
  remove(@Param("id") id: string) {
    return this.consultingService.remove(id);
  }
}
