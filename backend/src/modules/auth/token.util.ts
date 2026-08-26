import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Mesmo esquema de token do mock-backend (ver mock-backend/lib/auth.js) —
 * HMAC-SHA256 sobre um payload base64url, sem depender de nenhuma lib de JWT.
 * Mantém os dois backends 100% compatíveis com o mesmo frontend.
 */
export interface TokenPayload {
  email: string;
  expiresAt: number;
}

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function verifyPasswordHash(password: string, salt: string, expectedHash: string): boolean {
  const attempt = hashPassword(password, salt);
  const a = Buffer.from(attempt, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signToken(payload: TokenPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyToken(token: string | undefined, secret: string): TokenPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (!payload.expiresAt || Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function issueToken(email: string, secret: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return { token: signToken({ email, expiresAt }, secret), expiresAt };
}

export function randomSalt(): string {
  return randomBytes(16).toString("hex");
}
