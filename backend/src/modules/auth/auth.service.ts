import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../config/configuration";
import { hashPassword, issueToken, randomSalt, verifyPasswordHash, verifyToken, type TokenPayload } from "./token.util";

// Hash de fallback para desenvolvimento local (senha: ver mock-backend/lib/auth.js
// e a mensagem exibida no chat ao gerar as credenciais). Só protege algo se
// AUTH_PASSWORD/AUTH_SECRET NÃO forem sobrescritos em produção.
const DEFAULT_SALT = "ec8417e98eb430436ed24c7bb8495c45";
const DEFAULT_HASH =
  "7816212ae863763877a73fc3c1a4b595b0d02838e601164b43a88c651d88ee1597da50fbc54b593d7e540bc880a9c49f6c8ea4581d49576161b0683918dda753";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly loginAttempts = new Map<string, RateLimitEntry>();
  private cachedPasswordHash: { source: string; salt: string; hash: string } | null = null;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfig>("app")!;
    if (!config.authPassword) {
      this.logger.warn(
        "AUTH_PASSWORD/AUTH_SECRET não definidos — usando credenciais padrão de desenvolvimento. " +
          "Defina-os como variáveis de ambiente antes de publicar este servidor publicamente.",
      );
    }
  }

  private getCredentials(): { email: string; salt: string; hash: string } {
    const config = this.configService.get<AppConfig>("app")!;
    if (config.authPassword) {
      if (!this.cachedPasswordHash || this.cachedPasswordHash.source !== config.authPassword) {
        const salt = randomSalt();
        this.cachedPasswordHash = { source: config.authPassword, salt, hash: hashPassword(config.authPassword, salt) };
      }
      return { email: config.authEmail, salt: this.cachedPasswordHash.salt, hash: this.cachedPasswordHash.hash };
    }
    return { email: config.authEmail, salt: DEFAULT_SALT, hash: DEFAULT_HASH };
  }

  checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = this.loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
      this.loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
      return true;
    }
    entry.count += 1;
    return entry.count <= 8;
  }

  login(email: string, password: string): { token: string; expiresAt: number; email: string } {
    const creds = this.getCredentials();
    const normalized = email.toLowerCase();
    if (normalized !== creds.email || !verifyPasswordHash(password, creds.salt, creds.hash)) {
      throw new UnauthorizedException("Email ou senha inválidos.");
    }
    const config = this.configService.get<AppConfig>("app")!;
    const { token, expiresAt } = issueToken(normalized, config.authSecret);
    return { token, expiresAt, email: normalized };
  }

  verify(token: string | undefined): TokenPayload | null {
    const config = this.configService.get<AppConfig>("app")!;
    return verifyToken(token, config.authSecret);
  }
}
