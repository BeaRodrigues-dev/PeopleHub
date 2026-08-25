import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { Candidate, CandidateDocument } from "./schemas/candidate.schema";
import { CreateCandidateDto } from "./dto/create-candidate.dto";
import { UpdateCandidateDto } from "./dto/update-candidate.dto";
import { QueryCandidateDto } from "./dto/query-candidate.dto";

@Injectable()
export class CandidateService {
  constructor(@InjectModel(Candidate.name) private readonly model: Model<CandidateDocument>) {}

  async create(dto: CreateCandidateDto): Promise<CandidateDocument> {
    return this.model.create({ ...dto, vacancyId: dto.vacancyId ? new Types.ObjectId(dto.vacancyId) : null });
  }

  async findAll(query: QueryCandidateDto): Promise<PaginatedResult<CandidateDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: FilterQuery<CandidateDocument> = {};

    if (query.talentPoolOnly === "true") {
      filter.vacancyId = null;
    } else if (query.vacancyId) {
      filter.vacancyId = new Types.ObjectId(query.vacancyId);
    }
    if (query.skills?.length) filter.skills = { $all: query.skills };
    if (query.locations?.length) filter.location = { $in: query.locations };
    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), "i");
      filter.$or = [{ name: regex }, { email: regex }, { skills: regex }];
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

  async findById(id: string): Promise<CandidateDocument> {
    this.assertValidId(id);
    const candidate = await this.model.findById(id).exec();
    if (!candidate) throw new NotFoundException("Candidato não encontrado");
    return candidate;
  }

  async update(id: string, dto: UpdateCandidateDto): Promise<CandidateDocument> {
    this.assertValidId(id);
    const patch: Record<string, unknown> = { ...dto };
    if (dto.vacancyId !== undefined) {
      patch.vacancyId = dto.vacancyId ? new Types.ObjectId(dto.vacancyId) : null;
    }
    const candidate = await this.model.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).exec();
    if (!candidate) throw new NotFoundException("Candidato não encontrado");
    return candidate;
  }

  async remove(id: string): Promise<void> {
    this.assertValidId(id);
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException("Candidato não encontrado");
  }

  async countByVacancyIds(vacancyIds: string[]): Promise<Record<string, number>> {
    const counts = await this.model.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { vacancyId: { $in: vacancyIds.map((id) => new Types.ObjectId(id)) } } },
      { $group: { _id: "$vacancyId", count: { $sum: 1 } } },
    ]);
    const map: Record<string, number> = Object.fromEntries(vacancyIds.map((id) => [id, 0]));
    counts.forEach((c) => (map[c._id.toString()] = c.count));
    return map;
  }

  private assertValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Id inválido");
  }
}
