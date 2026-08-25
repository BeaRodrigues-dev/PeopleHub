import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { DEFAULT_STAGES, Vacancy, VacancyDocument } from "./schemas/vacancy.schema";
import { Application, ApplicationDocument } from "../application/schemas/application.schema";
import { CreateVacancyDto } from "./dto/create-vacancy.dto";
import { UpdateVacancyDto } from "./dto/update-vacancy.dto";
import { QueryVacancyDto } from "./dto/query-vacancy.dto";
import { AiService } from "../ai/ai.service";
import type { TimeToFillPrediction } from "../ai/interfaces/ai-provider.interface";

@Injectable()
export class VacancyService {
  constructor(
    @InjectModel(Vacancy.name) private readonly model: Model<VacancyDocument>,
    @InjectModel(Application.name) private readonly applicationModel: Model<ApplicationDocument>,
    private readonly aiService: AiService,
  ) {}

  async create(dto: CreateVacancyDto): Promise<VacancyDocument> {
    const stages = dto.stages?.length ? dto.stages : DEFAULT_STAGES;
    return this.model.create({ ...dto, stages });
  }

  async findAll(query: QueryVacancyDto): Promise<PaginatedResult<VacancyDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: FilterQuery<VacancyDocument> = {};
    if (query.status) filter.status = query.status;
    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), "i");
      filter.$or = [{ title: regex }, { department: regex }, { location: regex }];
    }

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit, hasMore: page * limit < total };
  }

  async findById(id: string): Promise<VacancyDocument> {
    this.assertValidId(id);
    const vacancy = await this.model.findById(id).exec();
    if (!vacancy) throw new NotFoundException("Vaga não encontrada");
    return vacancy;
  }

  async update(id: string, dto: UpdateVacancyDto): Promise<VacancyDocument> {
    this.assertValidId(id);
    const vacancy = await this.model.findByIdAndUpdate(id, dto, { new: true, runValidators: true }).exec();
    if (!vacancy) throw new NotFoundException("Vaga não encontrada");
    return vacancy;
  }

  async remove(id: string): Promise<void> {
    this.assertValidId(id);
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException("Vaga não encontrada");
  }

  async predictTimeToFill(id: string): Promise<TimeToFillPrediction> {
    const vacancy = await this.findById(id);
    const applications = await this.applicationModel.find({ vacancyId: vacancy._id }).exec();
    return this.aiService.predictTimeToFill(
      { seniority: vacancy.seniority, workModel: vacancy.workModel, requiredSkills: vacancy.requiredSkills },
      applications.map((a) => ({ status: a.status, currentStage: a.currentStage })),
    );
  }

  private assertValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Id inválido");
  }
}
