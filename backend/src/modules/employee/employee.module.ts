import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Employee, EmployeeSchema } from "./schemas/employee.schema";
import { EmployeeController } from "./employee.controller";
import { EmployeeService } from "./employee.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }])],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
