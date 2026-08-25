import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { Insight, InsightDocument } from "./schemas/insight.schema";
import { CreateInsightDto } from "./dto/insight.dto";
import { GeneratedInsight } from "../ai/interfaces/ai-provider.interface";

@Injectable()
export class InsightService {
  constructor(@InjectModel(Insight.name) private readonly model: Model<InsightDocument>) {}

  create(dto: CreateInsightDto, source: "manual" | "ai" = "manual"): Promise<InsightDocument> {
    return this.model.create({ ...dto, source, date: new Date().toISOString().slice(0, 10) });
  }

  async createMany(insights: GeneratedInsight[]): Promise<InsightDocument[]> {
    const docs = insights.map((i) => ({ ...i, source: "ai" as const, date: new Date().toISOString().slice(0, 10) }));
    return this.model.insertMany(docs) as unknown as Promise<InsightDocument[]>;
  }

  async findAll(): Promise<PaginatedResult<InsightDocument>> {
    const items = await this.model.find().sort({ createdAt: -1 }).exec();
    return { items, total: items.length, page: 1, limit: items.length || 1, hasMore: false };
  }

  async remove(id: string): Promise<void> {
    this.assertValidId(id);
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException("Insight não encontrado");
  }

  private assertValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Id inválido");
  }
}
