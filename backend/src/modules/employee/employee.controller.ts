import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { EmployeeService } from "./employee.service";
import { CreateEmployeeDto, QueryEmployeeDto, UpdateEmployeeDto } from "./dto/employee.dto";

@ApiTags("employees")
@Controller("employees")
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: "Criar colaborador" })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar colaboradores" })
  findAll(@Query() query: QueryEmployeeDto) {
    return this.employeeService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe do colaborador" })
  findOne(@Param("id") id: string) {
    return this.employeeService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar colaborador" })
  update(@Param("id") id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover colaborador" })
  remove(@Param("id") id: string) {
    return this.employeeService.remove(id);
  }
}
