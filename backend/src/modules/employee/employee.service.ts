import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { Employee, EmployeeDocument } from "./schemas/employee.schema";
import { CreateEmployeeDto, QueryEmployeeDto, UpdateEmployeeDto } from "./dto/employee.dto";

@Injectable()
export class EmployeeService {
  constructor(@InjectModel(Employee.name) private readonly model: Model<EmployeeDocument>) {}

  create(dto: CreateEmployeeDto): Promise<EmployeeDocument> {
    return this.model.create({ ...dto, contract: dto.contract ?? "Full-time", status: dto.status ?? "Active", lifecycle: dto.lifecycle ?? "Onboarding" });
  }

  async findAll(query: QueryEmployeeDto): Promise<PaginatedResult<EmployeeDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const filter: FilterQuery<EmployeeDocument> = {};
    if (query.lifecycle) filter.lifecycle = query.lifecycle;
    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), "i");
      filter.$or = [{ name: regex }, { role: regex }, { area: regex }];
    }
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit, hasMore: page * limit < total };
  }

  async findById(id: string): Promise<EmployeeDocument> {
    this.assertValidId(id);
    const employee = await this.model.findById(id).exec();
    if (!employee) throw new NotFoundException("Colaborador não encontrado");
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeDocument> {
    this.assertValidId(id);
    const employee = await this.model.findByIdAndUpdate(id, dto, { new: true, runValidators: true }).exec();
    if (!employee) throw new NotFoundException("Colaborador não encontrado");
    return employee;
  }

  async remove(id: string): Promise<void> {
    this.assertValidId(id);
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException("Colaborador não encontrado");
  }

  private assertValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Id inválido");
  }
}
