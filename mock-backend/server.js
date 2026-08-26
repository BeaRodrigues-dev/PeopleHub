"use strict";
/**
 * TalentFlow — servidor backend MOCK, zero dependências externas (só Node
 * built-ins: http, crypto, fs, path). Existe para permitir rodar o produto
 * inteiro localmente sem precisar de `npm install`, MongoDB ou uma
 * OPENAI_API_KEY — útil em ambientes sem acesso à internet, ou pra subir
 * uma demo em segundos.
 *
 * O contrato de endpoints/formato de resposta é o MESMO do backend NestJS
 * real (ver backend/src) — o frontend fala com os dois sem nenhuma
 * alteração de código, só trocando a variável VITE_API_URL.
 *
 * Rodar: node server.js  (porta padrão 3001, igual ao backend real)
 */
const http = require("http");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");

const { db, seed, computeProgress, CONSULTING_SERVICES } = require("./lib/db");
const ai = require("./lib/ai");
const { buildSyntheticResumeText } = require("./lib/resume");
const { sendJson, HttpError, readJsonBody, readRawBody, parseMultipart } = require("./lib/http-utils");
const auth = require("./lib/auth");

const PORT = Number(process.env.PORT || 3001);
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
seed();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = () => new Date().toISOString();

function paginate(items, { page = 1, limit = 20 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  const start = (p - 1) * l;
  return { items: items.slice(start, start + l), total: items.length, page: p, limit: l, hasMore: start + l < items.length };
}

function textMatches(candidate, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [candidate.name, candidate.email, ...(candidate.skills || [])].join(" ").toLowerCase();
  return haystack.includes(q);
}

function candidateMatchesFilters(candidate, q) {
  const locations = q.getAll("locations");
  const skills = q.getAll("skills");
  if (locations.length && !locations.includes(candidate.location)) return false;
  if (skills.length && !skills.every((s) => (candidate.skills || []).includes(s))) return false;
  return textMatches(candidate, q.get("search") || "");
}

function findVacancyOrThrow(id) {
  const vacancy = db.vacancies.find((v) => v.id === id);
  if (!vacancy) throw new HttpError(404, "Vaga não encontrada");
  return vacancy;
}
function findCandidateOrThrow(id) {
  const candidate = db.candidates.find((c) => c.id === id);
  if (!candidate) throw new HttpError(404, "Candidato não encontrado");
  return candidate;
}
function findApplicationOrThrow(id) {
  const application = db.applications.find((a) => a.id === id);
  if (!application) throw new HttpError(404, "Application não encontrada");
  return application;
}

function serializeApplication(application, populateCandidate) {
  if (!populateCandidate) return application;
  const candidate = db.candidates.find((c) => c.id === application.candidateId);
  return { ...application, candidateId: candidate || application.candidateId };
}

// ---------------------------------------------------------------------------
// Handlers — Candidates
// ---------------------------------------------------------------------------
function listCandidates(q, { forceTalentPoolOnly = false } = {}) {
  let items = db.candidates.filter((c) => candidateMatchesFilters(c, q));
  const talentPoolOnly = forceTalentPoolOnly || q.get("talentPoolOnly") === "true";
  if (talentPoolOnly) items = items.filter((c) => !c.vacancyId);
  const vacancyId = q.get("vacancyId");
  if (vacancyId) items = items.filter((c) => c.vacancyId === vacancyId);
  items = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return paginate(items, { page: q.get("page"), limit: q.get("limit") });
}

function createCandidate(body) {
  if (!body.name || !body.email) throw new HttpError(400, "name e email são obrigatórios");
  const timestamp = now();
  const candidate = {
    id: randomUUID(),
    name: body.name,
    email: body.email,
    phone: body.phone || "",
    location: body.location || "",
    avatar: body.avatar || null,
    resumeUrl: body.resumeUrl || null,
    resumeText: body.resumeText || null,
    experience: body.experience || [],
    education: body.education || [],
    skills: body.skills || [],
    languages: body.languages || [],
    seniority: body.seniority || "",
    linkedin: body.linkedin || "",
    portfolio: body.portfolio || "",
    notes: body.notes || "",
    vacancyId: body.vacancyId || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.candidates.push(candidate);
  return candidate;
}

function updateCandidate(id, patch) {
  const candidate = findCandidateOrThrow(id);
  Object.assign(candidate, patch, { updatedAt: now() });
  return candidate;
}

// ---------------------------------------------------------------------------
// Handlers — Vacancies
// ---------------------------------------------------------------------------
function listVacancies(q) {
  let items = [...db.vacancies];
  const status = q.get("status");
  if (status) items = items.filter((v) => v.status === status);
  const search = (q.get("search") || "").toLowerCase();
  if (search) items = items.filter((v) => `${v.title} ${v.department} ${v.location}`.toLowerCase().includes(search));
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return paginate(items, { page: q.get("page"), limit: q.get("limit") || 100 });
}

function createVacancy(body) {
  if (!body.title) throw new HttpError(400, "title é obrigatório");
  const timestamp = now();
  const stagesInput = Array.isArray(body.stages) && body.stages.length ? body.stages : [{ name: "Candidatura", order: 0 }];
  const vacancy = {
    id: randomUUID(),
    title: body.title,
    description: body.description || "",
    responsibilities: body.responsibilities || "",
    requirements: body.requirements || "",
    department: body.department || "",
    location: body.location || "",
    workModel: body.workModel || "Híbrido",
    seniority: body.seniority || "",
    status: body.status || "Aberta",
    requiredSkills: body.requiredSkills || [],
    stages: stagesInput.map((s, i) => ({ id: randomUUID(), name: s.name, order: i, isTerminal: !!s.isTerminal })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.vacancies.push(vacancy);
  return vacancy;
}

// ---------------------------------------------------------------------------
// Handlers — Applications
// ---------------------------------------------------------------------------
function createApplication(body) {
  const vacancy = findVacancyOrThrow(body.vacancyId);
  const candidate = findCandidateOrThrow(body.candidateId);
  const stages = [...vacancy.stages].sort((a, b) => a.order - b.order);
  const currentStage = body.currentStage || stages[0]?.name;
  if (!currentStage || !stages.some((s) => s.name === currentStage)) {
    throw new HttpError(400, "Etapa inválida para o pipeline desta vaga");
  }
  const duplicate = db.applications.find((a) => a.candidateId === candidate.id && a.vacancyId === vacancy.id);
  if (duplicate) throw new HttpError(409, "Este candidato já possui uma candidatura para esta vaga");

  const timestamp = now();
  const application = {
    id: randomUUID(),
    candidateId: candidate.id,
    vacancyId: vacancy.id,
    currentStage,
    matchScore: null,
    status: "ACTIVE",
    aiEvaluation: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.applications.push(application);
  candidate.vacancyId = vacancy.id;
  candidate.updatedAt = timestamp;
  return application;
}

function evaluateApplication(id) {
  const application = findApplicationOrThrow(id);
  const vacancy = findVacancyOrThrow(application.vacancyId);
  const candidate = findCandidateOrThrow(application.candidateId);
  const result = ai.matchCandidateToVacancy(vacancy, candidate);
  application.matchScore = result.matchScore;
  application.aiEvaluation = { ...result, evaluatedAt: now(), provider: "mock" };
  application.updatedAt = now();
  return application;
}

// ---------------------------------------------------------------------------
// Handlers — Talent Bank
// ---------------------------------------------------------------------------
function talentBankMatch(vacancyId) {
  const vacancy = findVacancyOrThrow(vacancyId);
  const pool = db.candidates.filter((c) => !c.vacancyId);
  const required = (vacancy.requiredSkills || []).map((s) => s.toLowerCase().trim());
  return pool
    .map((candidate) => {
      const candidateSkills = new Set((candidate.skills || []).map((s) => s.toLowerCase().trim()));
      const matchingSkills = vacancy.requiredSkills.filter((s) => candidateSkills.has(s.toLowerCase().trim()));
      const missingSkills = vacancy.requiredSkills.filter((s) => !candidateSkills.has(s.toLowerCase().trim()));
      const score = required.length ? Math.round((matchingSkills.length / required.length) * 100) : 0;
      return { candidate, score, matchingSkills, missingSkills };
    })
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Handlers — Employees (People)
// ---------------------------------------------------------------------------
function findEmployeeOrThrow(id) {
  const employee = db.employees.find((e) => e.id === id);
  if (!employee) throw new HttpError(404, "Colaborador não encontrado");
  return employee;
}

function listEmployees(q) {
  let items = [...db.employees];
  const lifecycle = q.get("lifecycle");
  if (lifecycle) items = items.filter((e) => e.lifecycle === lifecycle);
  const search = (q.get("search") || "").toLowerCase();
  if (search) items = items.filter((e) => `${e.name} ${e.role} ${e.area}`.toLowerCase().includes(search));
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return paginate(items, { page: q.get("page"), limit: q.get("limit") || 100 });
}

function createEmployee(body) {
  if (!body.name || !body.role) throw new HttpError(400, "name e role são obrigatórios");
  const timestamp = now();
  const employee = {
    id: randomUUID(),
    name: body.name,
    role: body.role,
    area: body.area || "",
    country: body.country || "",
    startDate: body.startDate || timestamp.slice(0, 10),
    manager: body.manager || "",
    contract: body.contract || "Full-time",
    status: body.status || "Active",
    lifecycle: body.lifecycle || "Onboarding",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.employees.push(employee);
  return employee;
}

// ---------------------------------------------------------------------------
// Handlers — Onboardings
// ---------------------------------------------------------------------------
function findOnboardingOrThrow(id) {
  const onboarding = db.onboardings.find((o) => o.id === id);
  if (!onboarding) throw new HttpError(404, "Onboarding não encontrado");
  return onboarding;
}

function createOnboarding(body) {
  if (!body.employeeName || !body.role) throw new HttpError(400, "employeeName e role são obrigatórios");
  const timestamp = now();
  const checklist = body.checklist || {
    before: [
      { label: "Contrato assinado", done: false },
      { label: "Acessos criados (email, Slack, ferramentas)", done: false },
      { label: "Equipamento preparado", done: false },
      { label: "Welcome email enviado", done: false },
    ],
    day1: [
      { label: "Welcome meeting com HR", done: false },
      { label: "Apresentação à equipa", done: false },
      { label: "Tour cultura & valores", done: false },
      { label: "Setup ferramentas", done: false },
    ],
    week1: [
      { label: "Follow-up 1:1 com manager", done: false },
      { label: "Feedback do novo colaborador", done: false },
      { label: "30-day plan alinhado", done: false },
    ],
  };
  const onboarding = {
    id: randomUUID(),
    employeeName: body.employeeName,
    role: body.role,
    startDate: body.startDate || timestamp.slice(0, 10),
    status: "Started",
    checklist,
    progress: computeProgress(checklist),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.onboardings.push(onboarding);
  return onboarding;
}

function toggleChecklistItem(id, phase, index) {
  const onboarding = findOnboardingOrThrow(id);
  if (!onboarding.checklist[phase] || !onboarding.checklist[phase][index]) {
    throw new HttpError(400, "Item de checklist inválido");
  }
  onboarding.checklist[phase][index].done = !onboarding.checklist[phase][index].done;
  onboarding.progress = computeProgress(onboarding.checklist);
  onboarding.status = onboarding.progress >= 100 ? "Completed" : onboarding.progress > 0 ? "In Progress" : "Started";
  onboarding.updatedAt = now();
  return onboarding;
}

// ---------------------------------------------------------------------------
// Handlers — Consulting Leads
// ---------------------------------------------------------------------------
function findConsultingLeadOrThrow(id) {
  const lead = db.consultingLeads.find((c) => c.id === id);
  if (!lead) throw new HttpError(404, "Empresa não encontrada no pipeline");
  return lead;
}

function createConsultingLead(body) {
  if (!body.company) throw new HttpError(400, "company é obrigatório");
  const timestamp = now();
  const lead = {
    id: randomUUID(),
    company: body.company,
    sector: body.sector || "",
    size: body.size || "",
    contact: body.contact || "",
    need: body.need || "",
    status: body.status || "Pesquisado",
    value: body.value || "—",
    aiQualification: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.consultingLeads.push(lead);
  return lead;
}

// ---------------------------------------------------------------------------
// Handlers — Insights
// ---------------------------------------------------------------------------
function findInsightOrThrow(id) {
  const insight = db.insights.find((i) => i.id === id);
  if (!insight) throw new HttpError(404, "Insight não encontrado");
  return insight;
}

function createInsight(body, source = "manual") {
  if (!body.text || !body.type) throw new HttpError(400, "text e type são obrigatórios");
  const timestamp = now();
  const insight = {
    id: randomUUID(),
    type: body.type,
    text: body.text,
    area: body.area || "",
    source,
    date: timestamp.slice(0, 10),
    createdAt: timestamp,
  };
  db.insights.push(insight);
  return insight;
}

// ---------------------------------------------------------------------------
// Handlers — Documents (manuais da área)
// ---------------------------------------------------------------------------
function findDocumentOrThrow(id) {
  const document = db.documents.find((d) => d.id === id);
  if (!document) throw new HttpError(404, "Documento não encontrado");
  return document;
}

// ---------------------------------------------------------------------------
// Handlers — Auth
// ---------------------------------------------------------------------------
function getAuthPayload(req) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  return auth.verifyToken(token);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const routes = [];
function route(method, pattern, handler) {
  const paramNames = [];
  const regex = new RegExp(
    "^" +
      pattern
        .split("/")
        .map((segment) => {
          if (segment.startsWith(":")) {
            paramNames.push(segment.slice(1));
            return "([^/]+)";
          }
          return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/") +
      "$",
  );
  routes.push({ method, regex, paramNames, handler });
}

route("POST", "/auth/login", async (ctx) => {
  const ip = ctx.req.socket?.remoteAddress || "unknown";
  if (!auth.checkLoginRateLimit(ip)) throw new HttpError(429, "Muitas tentativas de login. Aguarde alguns minutos.");
  const { email, password } = await readJsonBody(ctx.req);
  if (!email || !password) throw new HttpError(400, "Informe email e senha.");
  if (!auth.verifyPassword(email, password)) throw new HttpError(401, "Email ou senha inválidos.");
  const { token, expiresAt } = auth.issueToken(String(email).toLowerCase());
  sendJson(ctx.res, 200, { token, expiresAt, email: String(email).toLowerCase() });
});
route("GET", "/auth/me", async (ctx) => sendJson(ctx.res, 200, { email: ctx.req.authPayload.email }));

route("GET", "/candidates", async (ctx) => sendJson(ctx.res, 200, listCandidates(ctx.query)));
route("GET", "/candidates/counts-by-vacancy", async (ctx) => {
  const ids = (ctx.query.get("ids") || "").split(",").filter(Boolean);
  const counts = Object.fromEntries(ids.map((id) => [id, db.candidates.filter((c) => c.vacancyId === id).length]));
  sendJson(ctx.res, 200, counts);
});
route("POST", "/candidates/resume/parse", async (ctx) => {
  const raw = await readRawBody(ctx.req);
  const { files } = parseMultipart(raw, ctx.req.headers["content-type"]);
  const file = files.file;
  if (!file) throw new HttpError(400, "Envie um arquivo de currículo (PDF ou DOCX).");
  const ext = path.extname(file.filename) || ".pdf";
  const savedName = `${randomUUID()}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, savedName), file.buffer);

  const resumeText = buildSyntheticResumeText(file.filename);
  const extracted = ai.extractResumeData(resumeText);
  sendJson(ctx.res, 201, { extracted, resumeUrl: `/uploads/${savedName}`, resumeText });
});
route("POST", "/candidates", async (ctx) => sendJson(ctx.res, 201, createCandidate(await readJsonBody(ctx.req))));
route("GET", "/candidates/:id", async (ctx) => sendJson(ctx.res, 200, findCandidateOrThrow(ctx.params.id)));
route("PATCH", "/candidates/:id", async (ctx) => sendJson(ctx.res, 200, updateCandidate(ctx.params.id, await readJsonBody(ctx.req))));
route("DELETE", "/candidates/:id", async (ctx) => {
  findCandidateOrThrow(ctx.params.id);
  db.candidates = db.candidates.filter((c) => c.id !== ctx.params.id);
  sendJson(ctx.res, 200, { success: true });
});

route("GET", "/vacancies", async (ctx) => sendJson(ctx.res, 200, listVacancies(ctx.query)));
route("POST", "/vacancies", async (ctx) => sendJson(ctx.res, 201, createVacancy(await readJsonBody(ctx.req))));
route("GET", "/vacancies/:id", async (ctx) => sendJson(ctx.res, 200, findVacancyOrThrow(ctx.params.id)));
route("PATCH", "/vacancies/:id", async (ctx) => {
  const vacancy = findVacancyOrThrow(ctx.params.id);
  Object.assign(vacancy, await readJsonBody(ctx.req), { updatedAt: now() });
  sendJson(ctx.res, 200, vacancy);
});
route("DELETE", "/vacancies/:id", async (ctx) => {
  findVacancyOrThrow(ctx.params.id);
  db.vacancies = db.vacancies.filter((v) => v.id !== ctx.params.id);
  sendJson(ctx.res, 200, { success: true });
});

route("GET", "/applications", async (ctx) => {
  let items = [...db.applications];
  const vacancyId = ctx.query.get("vacancyId");
  const candidateId = ctx.query.get("candidateId");
  if (vacancyId) items = items.filter((a) => a.vacancyId === vacancyId);
  if (candidateId) items = items.filter((a) => a.candidateId === candidateId);
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const populate = ctx.query.get("populate") === "candidate";
  const page = paginate(items, { page: ctx.query.get("page"), limit: ctx.query.get("limit") || 50 });
  page.items = page.items.map((a) => serializeApplication(a, populate));
  sendJson(ctx.res, 200, page);
});
route("POST", "/applications", async (ctx) => sendJson(ctx.res, 201, createApplication(await readJsonBody(ctx.req))));
route("GET", "/applications/:id", async (ctx) => sendJson(ctx.res, 200, findApplicationOrThrow(ctx.params.id)));
route("PATCH", "/applications/:id/stage", async (ctx) => {
  const application = findApplicationOrThrow(ctx.params.id);
  const vacancy = findVacancyOrThrow(application.vacancyId);
  const { stage } = await readJsonBody(ctx.req);
  if (!vacancy.stages.some((s) => s.name === stage)) throw new HttpError(400, "Etapa inválida para o pipeline desta vaga");
  application.currentStage = stage;
  application.updatedAt = now();
  sendJson(ctx.res, 200, application);
});
route("PATCH", "/applications/:id/status", async (ctx) => {
  const application = findApplicationOrThrow(ctx.params.id);
  const { status } = await readJsonBody(ctx.req);
  application.status = status;
  application.updatedAt = now();
  sendJson(ctx.res, 200, application);
});
route("POST", "/applications/:id/evaluate", async (ctx) => sendJson(ctx.res, 200, evaluateApplication(ctx.params.id)));
route("DELETE", "/applications/:id", async (ctx) => {
  const application = findApplicationOrThrow(ctx.params.id);
  db.applications = db.applications.filter((a) => a.id !== ctx.params.id);
  const candidate = db.candidates.find((c) => c.id === application.candidateId);
  if (candidate && candidate.vacancyId === application.vacancyId) {
    candidate.vacancyId = null;
    candidate.updatedAt = now();
  }
  sendJson(ctx.res, 200, { success: true });
});

route("GET", "/talent-bank", async (ctx) => sendJson(ctx.res, 200, listCandidates(ctx.query, { forceTalentPoolOnly: true })));
route("GET", "/talent-bank/match/:vacancyId", async (ctx) => sendJson(ctx.res, 200, talentBankMatch(ctx.params.vacancyId)));
route("POST", "/talent-bank/match/:vacancyId/ai", async (ctx) => {
  const vacancy = findVacancyOrThrow(ctx.params.vacancyId);
  const baseline = talentBankMatch(ctx.params.vacancyId).slice(0, 10);
  const enriched = baseline.map(({ candidate }) => {
    const result = ai.matchCandidateToVacancy(vacancy, candidate);
    return { candidate, score: result.matchScore, matchingSkills: result.strengths, missingSkills: result.missingSkills, recommendation: result.recommendation, reasoning: result.reasoning };
  });
  enriched.sort((a, b) => b.score - a.score);
  sendJson(ctx.res, 200, enriched);
});
route("POST", "/talent-bank/assign", async (ctx) => {
  const { candidateIds, vacancyId } = await readJsonBody(ctx.req);
  const vacancy = findVacancyOrThrow(vacancyId);
  const firstStage = [...vacancy.stages].sort((a, b) => a.order - b.order)[0];
  const results = (candidateIds || []).map((candidateId) => createApplication({ candidateId, vacancyId, currentStage: firstStage.name }));
  sendJson(ctx.res, 201, results);
});

// -- Employees (People) ------------------------------------------------------
route("GET", "/employees", async (ctx) => sendJson(ctx.res, 200, listEmployees(ctx.query)));
route("POST", "/employees", async (ctx) => sendJson(ctx.res, 201, createEmployee(await readJsonBody(ctx.req))));
route("GET", "/employees/:id", async (ctx) => sendJson(ctx.res, 200, findEmployeeOrThrow(ctx.params.id)));
route("PATCH", "/employees/:id", async (ctx) => {
  const employee = findEmployeeOrThrow(ctx.params.id);
  Object.assign(employee, await readJsonBody(ctx.req), { updatedAt: now() });
  sendJson(ctx.res, 200, employee);
});
route("DELETE", "/employees/:id", async (ctx) => {
  findEmployeeOrThrow(ctx.params.id);
  db.employees = db.employees.filter((e) => e.id !== ctx.params.id);
  sendJson(ctx.res, 200, { success: true });
});

// -- Onboardings --------------------------------------------------------------
route("GET", "/onboardings", async (ctx) => {
  const items = [...db.onboardings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  sendJson(ctx.res, 200, paginate(items, { page: ctx.query.get("page"), limit: ctx.query.get("limit") || 100 }));
});
route("POST", "/onboardings", async (ctx) => sendJson(ctx.res, 201, createOnboarding(await readJsonBody(ctx.req))));
route("GET", "/onboardings/:id", async (ctx) => sendJson(ctx.res, 200, findOnboardingOrThrow(ctx.params.id)));
route("PATCH", "/onboardings/:id/checklist", async (ctx) => {
  const { phase, index } = await readJsonBody(ctx.req);
  sendJson(ctx.res, 200, toggleChecklistItem(ctx.params.id, phase, index));
});
route("DELETE", "/onboardings/:id", async (ctx) => {
  findOnboardingOrThrow(ctx.params.id);
  db.onboardings = db.onboardings.filter((o) => o.id !== ctx.params.id);
  sendJson(ctx.res, 200, { success: true });
});

// -- Consulting leads -----------------------------------------------------------
route("GET", "/consulting-leads/services", async (ctx) => sendJson(ctx.res, 200, CONSULTING_SERVICES));
route("GET", "/consulting-leads", async (ctx) => {
  const items = [...db.consultingLeads].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  sendJson(ctx.res, 200, paginate(items, { page: ctx.query.get("page"), limit: ctx.query.get("limit") || 100 }));
});
route("POST", "/consulting-leads", async (ctx) => sendJson(ctx.res, 201, createConsultingLead(await readJsonBody(ctx.req))));
route("PATCH", "/consulting-leads/:id", async (ctx) => {
  const lead = findConsultingLeadOrThrow(ctx.params.id);
  Object.assign(lead, await readJsonBody(ctx.req), { updatedAt: now() });
  sendJson(ctx.res, 200, lead);
});
route("DELETE", "/consulting-leads/:id", async (ctx) => {
  findConsultingLeadOrThrow(ctx.params.id);
  db.consultingLeads = db.consultingLeads.filter((c) => c.id !== ctx.params.id);
  sendJson(ctx.res, 200, { success: true });
});
route("POST", "/consulting-leads/:id/qualify", async (ctx) => {
  const lead = findConsultingLeadOrThrow(ctx.params.id);
  lead.aiQualification = ai.qualifyConsultingLead(lead);
  lead.updatedAt = now();
  sendJson(ctx.res, 200, lead);
});

// -- Insights -------------------------------------------------------------------
route("GET", "/insights", async (ctx) => {
  const items = [...db.insights].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  sendJson(ctx.res, 200, paginate(items, { page: ctx.query.get("page"), limit: ctx.query.get("limit") || 100 }));
});
route("POST", "/insights", async (ctx) => sendJson(ctx.res, 201, createInsight(await readJsonBody(ctx.req))));
route("DELETE", "/insights/:id", async (ctx) => {
  findInsightOrThrow(ctx.params.id);
  db.insights = db.insights.filter((i) => i.id !== ctx.params.id);
  sendJson(ctx.res, 200, { success: true });
});

// -- Documents (manuais da área) -------------------------------------------------
route("GET", "/documents", async (ctx) => {
  const items = [...db.documents].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  sendJson(ctx.res, 200, paginate(items, { page: ctx.query.get("page"), limit: ctx.query.get("limit") || 100 }));
});
route("POST", "/documents", async (ctx) => {
  const raw = await readRawBody(ctx.req);
  const { fields, files } = parseMultipart(raw, ctx.req.headers["content-type"]);
  const file = files.file;
  if (!file) throw new HttpError(400, "Envie um arquivo (PDF ou DOCX).");
  if (!fields.title) throw new HttpError(400, "title é obrigatório");
  const ext = path.extname(file.filename) || ".pdf";
  const savedName = `${randomUUID()}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, savedName), file.buffer);
  const timestamp = now();
  const document = {
    id: randomUUID(),
    title: fields.title,
    category: fields.category || "Outro",
    description: fields.description || "",
    fileUrl: `/uploads/${savedName}`,
    fileName: file.filename,
    fileType: file.mimetype,
    uploadedBy: "Beatriz Rodrigues",
    createdAt: timestamp,
  };
  db.documents.push(document);
  sendJson(ctx.res, 201, document);
});
route("DELETE", "/documents/:id", async (ctx) => {
  findDocumentOrThrow(ctx.params.id);
  db.documents = db.documents.filter((d) => d.id !== ctx.params.id);
  sendJson(ctx.res, 200, { success: true });
});

// -- AI: time-to-fill, insights automáticos, checklist e qualificação -----------
route("GET", "/vacancies/:id/time-to-fill", async (ctx) => {
  const vacancy = findVacancyOrThrow(ctx.params.id);
  const applications = db.applications.filter((a) => a.vacancyId === vacancy.id);
  sendJson(ctx.res, 200, ai.predictTimeToFill(vacancy, applications));
});
route("POST", "/ai/insights/generate", async (ctx) => {
  const generated = ai.generateInsights({
    vacancies: db.vacancies,
    applications: db.applications,
    candidates: db.candidates,
    onboardings: db.onboardings,
    consultingLeads: db.consultingLeads,
    employees: db.employees,
  });
  const created = generated.map((insight) => createInsight(insight, "ai"));
  sendJson(ctx.res, 201, created);
});
route("POST", "/ai/onboarding-checklist", async (ctx) => {
  const { role } = await readJsonBody(ctx.req);
  sendJson(ctx.res, 200, ai.suggestOnboardingChecklist(role || ""));
});

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const MIME_BY_EXT = { ".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".doc": "application/msword" };

function serveUpload(req, res, pathname) {
  const filename = decodeURIComponent(pathname.replace("/uploads/", ""));
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
    sendJson(res, 404, { message: "Arquivo não encontrado" });
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_BY_EXT[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const PUBLIC_API_PATHS = new Set(["/auth/login"]);

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = url.pathname;

  if (pathname.startsWith("/uploads/")) {
    serveUpload(req, res, pathname);
    return;
  }
  if (pathname === "/" || pathname === "/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "people-hub-mock-backend",
      vagas: db.vacancies.length,
      candidatos: db.candidates.length,
      colaboradores: db.employees.length,
      onboardings: db.onboardings.length,
      consultingLeads: db.consultingLeads.length,
      insights: db.insights.length,
    });
    return;
  }
  if (pathname.startsWith("/api/v1")) pathname = pathname.slice("/api/v1".length) || "/";

  // Todas as rotas da API exigem um token válido, exceto o login.
  if (!PUBLIC_API_PATHS.has(pathname)) {
    const payload = getAuthPayload(req);
    if (!payload) {
      sendJson(res, 401, { statusCode: 401, message: "Não autenticado. Faça login novamente." });
      return;
    }
    req.authPayload = payload;
  }

  const match = routes.find((r) => r.method === req.method && r.regex.test(pathname));
  if (!match) {
    sendJson(res, 404, { statusCode: 404, message: `Rota não encontrada: ${req.method} ${pathname}` });
    return;
  }

  const values = match.regex.exec(pathname).slice(1);
  const params = Object.fromEntries(match.paramNames.map((name, i) => [name, decodeURIComponent(values[i])]));

  try {
    await match.handler({ req, res, params, query: url.searchParams });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, { statusCode: error.status, message: error.message });
    } else {
      // eslint-disable-next-line no-console
      console.error(error);
      sendJson(res, 500, { statusCode: 500, message: "Erro interno do servidor" });
    }
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 TalentFlow mock backend em http://localhost:${PORT}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`   (zero dependências — dados em memória, perdidos ao reiniciar)`);
});
