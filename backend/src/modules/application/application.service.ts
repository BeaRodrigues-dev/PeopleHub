import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { Application, ApplicationDocument } from "./schemas/application.schema";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { MoveStageDto } from "./dto/move-stage.dto";
import { UpdateApplicationStatusDto } from "./dto/update-status.dto";
import { QueryApplicationDto } from "./dto/query-application.dto";
import { CandidateService } from "../candidate/candidate.service";
import { VacancyService } from "../vacancy/vacancy.service";
import { AiService } from "../ai/ai.service";

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) private readonly model: Model<ApplicationDocument>,
    private readonly candidateService: CandidateService,
    private readonly vacancyService: VacancyService,
    private readonly aiService: AiService,
  ) {}

  /** Vincula um candidato a uma vaga: cria a Application e atualiza Candidate.vacancyId. */
  async create(dto: CreateApplicationDto): Promise<ApplicationDocument> {
    const vacancy = await this.vacancyService.findById(dto.vacancyId);
    const candidate = await this.candidateService.findById(dto.candidateId);

    const stages = [...vacancy.stages].sort((a, b) => a.order - b.order);
    const firstStage = stages[0]?.name;
    const currentStage = dto.currentStage ?? firstStage;
    if (!currentStage || !stages.some((s) => s.name === currentStage)) {
      throw new BadRequestException("Etapa inválida para o pipeline desta vaga");
    }

    try {
      const application = await this.model.create({
        candidateId: new Types.ObjectId(dto.candidateId),
        vacancyId: new Types.ObjectId(dto.vacancyId),
        currentStage,
      });
      await this.candidateService.update(candidate.id, { vacancyId: dto.vacancyId });
      return application;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException("Este candidato já possui uma candidatura para esta vaga");
      }
      throw error;
    }
  }

  async findAll(query: QueryApplicationDto, options: { populateCandidate?: boolean } = {}): Promise<PaginatedResult<ApplicationDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const filter: FilterQuery<ApplicationDocument> = {};
    if (query.candidateId) filter.candidateId = new Types.ObjectId(query.candidateId);
    if (query.vacancyId) filter.vacancyId = new Types.ObjectId(query.vacancyId);

    let cursor = this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    // Usado pelo Kanban da vaga: traz o candidato completo junto de cada
    // Application num único round-trip, em vez de N+1 requisições.
    if (options.populateCandidate) cursor = cursor.populate("candidateId");

    const [items, total] = await Promise.all([cursor.exec(), this.model.countDocuments(filter)]);
    return { items, total, page, limit, hasMore: page * limit < total };
  }

  async findById(id: string): Promise<ApplicationDocument> {
    this.assertValidId(id);
    const application = await this.model.findById(id).exec();
    if (!application) throw new NotFoundException("Application não encontrada");
    return application;
  }

  async moveStage(id: string, dto: MoveStageDto): Promise<ApplicationDocument> {
    const application = await this.findById(id);
    const vacancy = await this.vacancyService.findById(application.vacancyId.toString());
    if (!vacancy.stages.some((s) => s.name === dto.stage)) {
      throw new BadRequestException("Etapa inválida para o pipeline desta vaga");
    }
    application.currentStage = dto.stage;
    await application.save();
    return application;
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto): Promise<ApplicationDocument> {
    const application = await this.findById(id);
    application.status = dto.status;
    await application.save();
    return application;
  }

  /** Calcula (via IA) a aderência do candidato à vaga e salva o resultado na Application. */
  async evaluate(id: string): Promise<ApplicationDocument> {
    const application = await this.findById(id);
    const [vacancy, candidate] = await Promise.all([
      this.vacancyService.findById(application.vacancyId.toString()),
      this.candidateService.findById(application.candidateId.toString()),
    ]);

    const result = await this.aiService.matchCandidateToVacancy(
      { title: vacancy.title, description: vacancy.description, requiredSkills: vacancy.requiredSkills, seniority: vacancy.seniority },
      {
        name: candidate.name,
        skills: candidate.skills,
        seniority: candidate.seniority,
        experienceSummary: candidate.experience?.map((e) => `${e.role} @ ${e.company}`).join("; "),
      },
    );

    application.matchScore = result.matchScore;
    application.aiEvaluation = { ...result, evaluatedAt: new Date(), provider: this.aiService.providerName };
    await application.save();
    return application;
  }

  /** Remove a candidatura; se essa vaga era a "vaga atual" do candidato, ele volta ao Banco de Talentos. */
  async remove(id: string): Promise<void> {
    const application = await this.findById(id);
    await this.model.findByIdAndDelete(id).exec();
    const candidate = await this.candidateService.findById(application.candidateId.toString());
    if (candidate.vacancyId?.toString() === application.vacancyId.toString()) {
      await this.candidateService.update(candidate.id, { vacancyId: null });
    }
  }

  private assertValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Id inválido");
  }
}
