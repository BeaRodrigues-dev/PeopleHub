"use strict";
/**
 * Autenticação simples de conta única (email + senha), zero dependências
 * (só `crypto` do Node). Emite um token assinado por HMAC-SHA256 (formato
 * parecido com JWT: `<payload base64url>.<assinatura>`), sem biblioteca de
 * JWT externa.
 *
 * IMPORTANTE — segurança em produção:
 *   - Defina AUTH_EMAIL, AUTH_PASSWORD e AUTH_SECRET como variáveis de
 *     ambiente no seu host (Render → serviço → Environment) antes de deixar
 *     o site acessível publicamente. Os valores abaixo (DEFAULT_*) são só
 *     para desenvolvimento local — não protegem nada se o repositório for
 *     público, pois o hash fica versionado no código.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_EMAIL = "beatriz@peoplehub.local";
const DEFAULT_SALT = "ec8417e98eb430436ed24c7bb8495c45";
const DEFAULT_HASH =
  "7816212ae863763877a73fc3c1a4b595b0d02838e601164b43a88c651d88ee1597da50fbc54b593d7e540bc880a9c49f6c8ea4581d49576161b0683918dda753";

// Credenciais trocadas pelo usuário na tela de Configurações ficam salvas
// aqui (fora do git, ver .gitignore) — têm prioridade sobre AUTH_EMAIL/
// AUTH_PASSWORD e sobre as credenciais padrão de desenvolvimento.
const AUTH_FILE = path.join(__dirname, "..", "data", "auth.json");

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-only-insecure-secret-troque-em-producao";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h

if (!process.env.AUTH_SECRET || !process.env.AUTH_PASSWORD) {
  // eslint-disable-next-line no-console
  console.warn(
    "[auth] AUTH_SECRET/AUTH_PASSWORD não definidos — usando credenciais padrão de desenvolvimento. " +
      "Defina-os como variáveis de ambiente antes de publicar este servidor publicamente.",
  );
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function loadOverride() {
  try {
    const raw = fs.readFileSync(AUTH_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email && parsed.salt && parsed.hash) return parsed;
  } catch {
    // sem override salvo ainda — segue para env vars / padrão
  }
  return null;
}

function saveOverride(email, salt, hash) {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ email, salt, hash }), "utf8");
}

function getCredentials() {
  const override = loadOverride();
  if (override) return { email: override.email.toLowerCase(), salt: override.salt, hash: override.hash };

  const email = (process.env.AUTH_EMAIL || DEFAULT_EMAIL).toLowerCase();
  if (process.env.AUTH_PASSWORD) {
    // Deriva o hash uma vez, na inicialização do processo — a senha em
    // texto puro só existe na env var do host, nunca é persistida em disco.
    if (!getCredentials._cache || getCredentials._cache.source !== process.env.AUTH_PASSWORD) {
      const salt = crypto.randomBytes(16).toString("hex");
      getCredentials._cache = { source: process.env.AUTH_PASSWORD, salt, hash: hashPassword(process.env.AUTH_PASSWORD, salt) };
    }
    return { email, salt: getCredentials._cache.salt, hash: getCredentials._cache.hash };
  }
  return { email, salt: DEFAULT_SALT, hash: DEFAULT_HASH };
}

function verifyPassword(email, password) {
  const creds = getCredentials();
  if (String(email || "").toLowerCase() !== creds.email) return false;
  const attempt = hashPassword(String(password || ""), creds.salt);
  return crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(creds.hash, "hex"));
}

/**
 * Troca email e/ou senha da conta. Exige a senha atual correta. Salva em
 * AUTH_FILE, que passa a ter prioridade sobre env vars e credenciais padrão.
 * Retorna o novo email (em minúsculas) em caso de sucesso, ou lança erro.
 */
function updateCredentials({ currentPassword, newEmail, newPassword }) {
  const creds = getCredentials();
  const attempt = hashPassword(String(currentPassword || ""), creds.salt);
  const currentOk = crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(creds.hash, "hex"));
  if (!currentOk) {
    const err = new Error("Senha atual incorreta.");
    err.statusCode = 401;
    throw err;
  }
  const email = (newEmail && newEmail.trim() ? newEmail.trim() : creds.email).toLowerCase();
  let salt = creds.salt;
  let hash = creds.hash;
  if (newPassword && newPassword.trim()) {
    salt = crypto.randomBytes(16).toString("hex");
    hash = hashPassword(newPassword.trim(), salt);
  }
  saveOverride(email, salt, hash);
  return email;
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function issueToken(email) {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return { token: sign({ email, expiresAt }), expiresAt };
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.expiresAt || Date.now() > payload.expiresAt) return null;
  return payload;
}

// Rate limit simples de tentativas de login por IP (defesa contra força bruta).
const loginAttempts = new Map();
function checkLoginRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 8;
}

module.exports = { verifyPassword, issueToken, verifyToken, checkLoginRateLimit, getCredentials, updateCredentials };
