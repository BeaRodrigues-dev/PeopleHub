import { Injectable } from "@nestjs/common";
import type { PaginatedResult } from "../../common/dto/pagination-query.dto";
import { CandidateService } from "../candidate/candidate.service";
import { VacancyService } from "../vacancy/vacancy.service";
import { ApplicationService } from "../application/application.service";
import { AiService } from "../ai/ai.service";
import { CandidateDocument } from "../candidate/schemas/candidate.schema";
import { QueryCandidateDto } from "../candidate/dto/query-candidate.dto";
import { AssignToVacancyDto } from "./dto/assign-to-vacancy.dto";
import type { TalentBankMatchDto } from "./dto/match-result.dto";

const normalize = (skill: string) => skill.trim().toLowerCase();

@Injectable()
export class TalentBankService {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly vacancyService: VacancyService,
    private readonly applicationService: ApplicationService,
    private readonly aiService: AiService,
  ) {}

  /** Candidatos sem vaga vinculada (aceita os mesmos filtros de busca do /candidates). */
  list(query: QueryCandidateDto): Promise<PaginatedResult<CandidateDocument>> {
    return this.candidateService.findAll({ ...query, talentPoolOnly: "true" });
  }

  /**
   * Ranking rápido (determinístico, sem custo de IA) de todo o Banco de
   * Talentos contra as competências exigidas pela vaga — usado como
   * sugestão padrão na tela da vaga.
   */
  async matchForVacancy(vacancyId: string): Promise<TalentBankMatchDto[]> {
    const vacancy = await this.vacancyService.findById(vacancyId);
    const { items: pool } = await this.candidateService.findAll({ talentPoolOnly: "true", page: 1, limit: 500 });

    const required = vacancy.requiredSkills.map(normalize);
    return pool
      .map((candidate) => {
        const candidateSkills = new Set(candidate.skills.map(normalize));
        const matchingSkills = vacancy.requiredSkills.filter((s) => candidateSkills.has(normalize(s)));
        const missingSkills = vacancy.requiredSkills.filter((s) => !candidateSkills.has(normalize(s)));
        const score = required.length ? Math.round((matchingSkills.length / required.length) * 100) : 0;
        return { candidate: candidate.toJSON() as any, score, matchingSkills, missingSkills };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Reforça o ranking rápido com avaliação de IA (mais lenta/custosa) para
   * os top N candidatos — usado quando o recrutador pede uma análise mais
   * profunda em vez do heurístico padrão.
   */
  async matchForVacancyWithAi(vacancyId: string, topN = 10): Promise<TalentBankMatchDto[]> {
    const vacancy = await this.vacancyService.findById(vacancyId);
    const baseline = await this.matchForVacancy(vacancyId);
    const candidates = baseline.slice(0, topN);

    const enriched = await Promise.all(
      candidates.map(async ({ candidate }) => {
        const result = await this.aiService.matchCandidateToVacancy(
          { title: vacancy.title, description: vacancy.description, requiredSkills: vacancy.requiredSkills, seniority: vacancy.seniority },
          { name: candidate.name, skills: candidate.skills, seniority: candidate.seniority },
        );
        return {
          candidate,
          score: result.matchScore,
          matchingSkills: result.strengths,
          missingSkills: result.missingSkills,
          recommendation: result.recommendation,
          reasoning: result.reasoning,
        };
      }),
    );
    return enriched.sort((a, b) => b.score - a.score);
  }

  /** Adiciona candidatos do banco de talentos a uma vaga (cria a Application de cada um). */
  async assign(dto: AssignToVacancyDto) {
    const vacancy = await this.vacancyService.findById(dto.vacancyId);
    const firstStage = [...vacancy.stages].sort((a, b) => a.order - b.order)[0]?.name;
    const results = [];
    for (const candidateId of dto.candidateIds) {
      results.push(await this.applicationService.create({ candidateId, vacancyId: dto.vacancyId, currentStage: firstStage }));
    }
    return results;
  }
}
