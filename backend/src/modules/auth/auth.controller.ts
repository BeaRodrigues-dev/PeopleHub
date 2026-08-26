import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Login (conta única) — retorna token Bearer" })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    if (!this.authService.checkRateLimit(ip)) {
      throw new HttpException("Muitas tentativas de login. Aguarde alguns minutos.", HttpStatus.TOO_MANY_REQUESTS);
    }
    return this.authService.login(dto.email, dto.password);
  }

  @Get("me")
  @ApiOperation({ summary: "Dados do usuário autenticado" })
  me(@Req() req: Request & { authPayload?: { email: string } }) {
    return { email: req.authPayload?.email };
  }
}
