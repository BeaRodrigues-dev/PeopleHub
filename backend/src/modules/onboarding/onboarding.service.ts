import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { computeProgress, DEFAULT_ONBOARDING_CHECKLIST, OnboardingEntry, OnboardingEntryDocument } from "./schemas/onboarding.schema";
import { CreateOnboardingDto, ToggleChecklistItemDto } from "./dto/onboarding.dto";

@Injectable()
export class OnboardingService {
  constructor(@InjectModel(OnboardingEntry.name) private readonly model: Model<OnboardingEntryDocument>) {}

  create(dto: CreateOnboardingDto): Promise<OnboardingEntryDocument> {
    const checklist = dto.checklist ?? DEFAULT_ONBOARDING_CHECKLIST;
    return this.model.create({ ...dto, checklist, progress: computeProgress(checklist as any), status: "Started" });
  }

  async findAll(): Promise<PaginatedResult<OnboardingEntryDocument>> {
    const items = await this.model.find().sort({ createdAt: -1 }).exec();
    return { items, total: items.length, page: 1, limit: items.length || 1, hasMore: false };
  }

  async findById(id: string): Promise<OnboardingEntryDocument> {
    this.assertValidId(id);
    const entry = await this.model.findById(id).exec();
    if (!entry) throw new NotFoundException("Onboarding não encontrado");
    return entry;
  }

  async toggleChecklistItem(id: string, dto: ToggleChecklistItemDto): Promise<OnboardingEntryDocument> {
    const entry = await this.findById(id);
    const items = entry.checklist[dto.phase];
    if (!items || !items[dto.index]) throw new BadRequestException("Item de checklist inválido");
    items[dto.index].done = !items[dto.index].done;
    entry.progress = computeProgress(entry.checklist);
    entry.status = entry.progress >= 100 ? "Completed" : entry.progress > 0 ? "In Progress" : "Started";
    entry.markModified("checklist");
    await entry.save();
    return entry;
  }

  async remove(id: string): Promise<void> {
    this.assertValidId(id);
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException("Onboarding não encontrado");
  }

  private assertValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Id inválido");
  }
}
