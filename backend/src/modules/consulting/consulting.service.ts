import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { ConsultingLead, ConsultingLeadDocument } from "./schemas/consulting-lead.schema";
import { CreateConsultingLeadDto, UpdateConsultingLeadDto } from "./dto/consulting-lead.dto";
import { AiService } from "../ai/ai.service";

export const CONSULTING_SERVICES = [
  { id: "recruitment", name: "Recruitment", desc: "Atração e seleção de talento para empresas parceiras", price: "€800–2.400/vaga", icon: "🎯" },
  { id: "talent-hunting", name: "Talent Hunting", desc: "Pesquisa proativa de perfis estratégicos e headhunting", price: "€1.200–3.000/vaga", icon: "🕵️" },
  { id: "hr-setup", name: "HR Setup", desc: "Criação de processos e estrutura de RH do zero", price: "€2.500–6.000/projeto", icon: "🏗️" },
  { id: "onboarding-design", name: "Onboarding Design", desc: "Desenho e implementação de programas de onboarding", price: "€1.500–3.500/projeto", icon: "🚀" },
  { id: "people-processes", name: "People Processes", desc: "Definição de OKRs, performance review e cultura", price: "€1.000–4.000/projeto", icon: "⚙️" },
];

@Injectable()
export class ConsultingService {
  constructor(
    @InjectModel(ConsultingLead.name) private readonly model: Model<ConsultingLeadDocument>,
    private readonly aiService: AiService,
  ) {}

  create(dto: CreateConsultingLeadDto): Promise<ConsultingLeadDocument> {
    return this.model.create({ ...dto, status: dto.status ?? "Pesquisado", value: dto.value ?? "—" });
  }

  async findAll(): Promise<PaginatedResult<ConsultingLeadDocument>> {
    const items = await this.model.find().sort({ createdAt: -1 }).exec();
    return { items, total: items.length, page: 1, limit: items.length || 1, hasMore: false };
  }

  services() {
    return CONSULTING_SERVICES;
  }

  async findById(id: string): Promise<ConsultingLeadDocument> {
    this.assertValidId(id);
    const lead = await this.model.findById(id).exec();
    if (!lead) throw new NotFoundException("Empresa não encontrada no pipeline");
    return lead;
  }

  async update(id: string, dto: UpdateConsultingLeadDto): Promise<ConsultingLeadDocument> {
    this.assertValidId(id);
    const lead = await this.model.findByIdAndUpdate(id, dto, { new: true, runValidators: true }).exec();
    if (!lead) throw new NotFoundException("Empresa não encontrada no pipeline");
    return lead;
  }

  async qualifyWithAi(id: string): Promise<ConsultingLeadDocument> {
    const lead = await this.findById(id);
    const qualification = await this.aiService.qualifyConsultingLead({
      company: lead.company,
      sector: lead.sector,
      size: lead.size,
      need: lead.need,
      status: lead.status,
      value: lead.value,
    });
    lead.aiQualification = { ...qualification, evaluatedAt: new Date() };
    await lead.save();
    return lead;
  }

  async remove(id: string): Promise<void> {
    this.assertValidId(id);
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException("Empresa não encontrada no pipeline");
  }

  private assertValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Id inválido");
  }
}
