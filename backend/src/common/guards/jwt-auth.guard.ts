import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AuthService } from "../../modules/auth/auth.service";

/**
 * Guard de autenticação global (registrado em AppModule via APP_GUARD).
 * Valida o Bearer token (mesmo esquema HMAC do mock-backend, ver
 * modules/auth/token.util.ts). Rotas marcadas com @Public() (ex.: POST
 * /auth/login) ficam liberadas.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { authPayload?: { email: string; expiresAt: number } }>();
    const [, token] = (request.headers.authorization || "").split(" ");
    const payload = this.authService.verify(token);
    if (!payload) throw new UnauthorizedException("Não autenticado. Faça login novamente.");

    request.authPayload = payload;
    return true;
  }
}
