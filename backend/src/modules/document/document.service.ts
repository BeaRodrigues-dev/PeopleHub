import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { HrDocument, HrDocumentDocument } from "./schemas/document.schema";

@Injectable()
export class DocumentService {
  constructor(@InjectModel(HrDocument.name) private readonly model: Model<HrDocumentDocument>) {}

  create(data: { title: string; category: string; description?: string; fileUrl: string; fileName: string; fileType: string }): Promise<HrDocumentDocument> {
    return this.model.create(data);
  }

  async findAll(): Promise<PaginatedResult<HrDocumentDocument>> {
    const items = await this.model.find().sort({ createdAt: -1 }).exec();
    return { items, total: items.length, page: 1, limit: items.length || 1, hasMore: false };
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Id inválido");
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException("Documento não encontrado");
  }
}
