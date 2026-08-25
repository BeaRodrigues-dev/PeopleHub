import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InsightService } from "./insight.service";
import { CreateInsightDto } from "./dto/insight.dto";
import { AiService } from "../ai/ai.service";
import { Vacancy, VacancyDocument } from "../vacancy/schemas/vacancy.schema";
import { Application, ApplicationDocument } from "../application/schemas/application.schema";
import { Candidate, CandidateDocument } from "../candidate/schemas/candidate.schema";
import { Employee, EmployeeDocument } from "../employee/schemas/employee.schema";
import { OnboardingEntry, OnboardingEntryDocument } from "../onboarding/schemas/onboarding.schema";
import { ConsultingLead, ConsultingLeadDocument } from "../consulting/schemas/consulting-lead.schema";

@ApiTags("insights")
@Controller("insights")
export class InsightController {
  constructor(private readonly insightService: InsightService) {}

  @Post()
  @ApiOperation({ summary: "Registar insight manual" })
  create(@Body() dto: CreateInsightDto) {
    return this.insightService.create(dto, "manual");
  }

  @Get()
  @ApiOperation({ summary: "Listar insights" })
  findAll() {
    return this.insightService.findAll();
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover insight" })
  remove(@Param("id") id: string) {
    return this.insightService.remove(id);
  }
}

/**
 * Controller separado (prefixo "ai/insights") só para manter paridade de
 * contrato com o mock-backend. Lê um snapshot read-only de várias coleções
 * (registadas diretamente via forFeature no InsightModule, sem depender dos
 * outros módulos de feature — evita dependência circular com ApplicationModule/
 * TalentBankModule, que já importam AiModule).
 */
@ApiTags("ai")
@Controller("ai/insights")
export class AiInsightsController {
  constructor(
    private readonly aiService: AiService,
    private readonly insightService: InsightService,
    @InjectModel(Vacancy.name) private readonly vacancyModel: Model<VacancyDocument>,
    @InjectModel(Application.name) private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Candidate.name) private readonly candidateModel: Model<CandidateDocument>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(OnboardingEntry.name) private readonly onboardingModel: Model<OnboardingEntryDocument>,
    @InjectModel(ConsultingLead.name) private readonly consultingLeadModel: Model<ConsultingLeadDocument>,
  ) {}

  @Post("generate")
  @ApiOperation({ summary: "Gerar insights automáticos com IA a partir dos dados do sistema" })
  async generate() {
    const [vacancies, applications, candidates, employees, onboardings, consultingLeads] = await Promise.all([
      this.vacancyModel.find().exec(),
      this.applicationModel.find().exec(),
      this.candidateModel.find().exec(),
      this.employeeModel.find().exec(),
      this.onboardingModel.find().exec(),
      this.consultingLeadModel.find().exec(),
    ]);

    const snapshot = {
      vacancies: vacancies.map((v) => ({ id: String(v._id), title: v.title, status: v.status, createdAt: (v as any).createdAt, requiredSkills: v.requiredSkills, seniority: v.seniority, workModel: v.workModel })),
      applications: applications.map((a) => ({ vacancyId: String(a.vacancyId), status: a.status, currentStage: a.currentStage })),
      candidates: candidates.map((c) => ({ vacancyId: c.vacancyId ? String(c.vacancyId) : null, skills: c.skills })),
      onboardings: onboardings.map((o) => ({ employeeName: o.employeeName, startDate: o.startDate, progress: o.progress })),
      consultingLeads: consultingLeads.map((c) => ({ company: c.company, status: c.status, need: c.need ?? "", createdAt: (c as any).createdAt })),
      employees: employees.map((e) => ({ name: e.name, status: e.status, lifecycle: e.lifecycle })),
    };

    const generated = await this.aiService.generateInsights(snapshot);
    return this.insightService.createMany(generated);
  }
}
