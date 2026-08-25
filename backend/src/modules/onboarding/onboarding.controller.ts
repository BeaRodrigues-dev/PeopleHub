import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { OnboardingService } from "./onboarding.service";
import { AiService } from "../ai/ai.service";
import { CreateOnboardingDto, SuggestChecklistDto, ToggleChecklistItemDto } from "./dto/onboarding.dto";

@ApiTags("onboardings")
@Controller("onboardings")
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar onboarding" })
  create(@Body() dto: CreateOnboardingDto) {
    return this.onboardingService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar onboardings" })
  findAll() {
    return this.onboardingService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe do onboarding" })
  findOne(@Param("id") id: string) {
    return this.onboardingService.findById(id);
  }

  @Patch(":id/checklist")
  @ApiOperation({ summary: "Marcar/desmarcar item do checklist" })
  toggle(@Param("id") id: string, @Body() dto: ToggleChecklistItemDto) {
    return this.onboardingService.toggleChecklistItem(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover onboarding" })
  remove(@Param("id") id: string) {
    return this.onboardingService.remove(id);
  }
}

/** Controller separado (prefixo "ai") só para manter paridade de contrato com o mock-backend. */
@ApiTags("ai")
@Controller("ai")
export class OnboardingAiController {
  constructor(private readonly aiService: AiService) {}

  @Post("onboarding-checklist")
  @ApiOperation({ summary: "Sugerir checklist de onboarding com IA a partir do cargo" })
  suggestChecklist(@Body() dto: SuggestChecklistDto) {
    return this.aiService.suggestOnboardingChecklist(dto.role);
  }
}
