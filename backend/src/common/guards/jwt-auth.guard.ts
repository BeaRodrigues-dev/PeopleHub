import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Guard de autenticação — preparado para o futuro, ainda não aplicado
 * globalmente (ver AppModule). Hoje ele só identifica um Bearer token, se
 * existir, e deixa a requisição passar; quando a autenticação for
 * implementada de fato, basta:
 *   1) validar/decodificar o token aqui (JWT, sessão, etc.);
 *   2) lançar UnauthorizedException quando inválido/ausente;
 *   3) registrar este guard como APP_GUARD global em AppModule.
 * Rotas marcadas com @Public() continuam liberadas mesmo depois disso.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    // TODO: quando a autenticação for implementada, validar o token aqui.
    void authHeader;
    return true;
  }
}
