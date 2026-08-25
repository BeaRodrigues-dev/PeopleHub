"use strict";
/**
 * "Banco de dados" em memória — zero dependências (sem mongoose/MongoDB de
 * verdade). Existe para permitir rodar o backend localmente neste ambiente
 * sem acesso à internet (não é possível `npm install` nem baixar um
 * MongoDB aqui). O contrato de dados/endpoints é idêntico ao backend NestJS
 * real em `backend/src` — troque um pelo outro sem tocar no frontend.
 *
 * Tudo é perdido ao reiniciar o processo (`node server.js`), de propósito.
 */
const crypto = require("crypto");

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const DEFAULT_STAGES = [
  { name: "Candidatura", order: 0, isTerminal: false },
  { name: "Triagem", order: 1, isTerminal: false },
  { name: "Entrevista RH", order: 2, isTerminal: false },
  { name: "Entrevista Técnica", order: 3, isTerminal: false },
  { name: "Oferta", order: 4, isTerminal: false },
  { name: "Contratado", order: 5, isTerminal: true },
];

function buildStages(stages) {
  return stages.map((s, i) => ({ id: uid(), name: s.name, order: i, isTerminal: !!s.isTerminal }));
}

const vacancySeeds = [
  { title: "Engenheiro(a) de Software Frontend", department: "Engenharia", location: "São Paulo, SP", workModel: "Híbrido", seniority: "Sênior", status: "Aberta", requiredSkills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"] },
  { title: "Product Designer Pleno", department: "Design", location: "Remoto", workModel: "Remoto", seniority: "Pleno", status: "Aberta", requiredSkills: ["Figma", "Design System", "Pesquisa", "Prototipação"] },
  { title: "Engenheiro(a) de Dados Sênior", department: "Dados", location: "Remoto", workModel: "Remoto", seniority: "Sênior", status: "Aberta", requiredSkills: ["Python", "SQL", "Airflow", "Spark", "AWS"] },
  { title: "Product Manager Sênior", department: "Produto", location: "São Paulo, SP", workModel: "Híbrido", seniority: "Sênior", status: "Pausada", requiredSkills: ["Discovery", "Roadmap", "SQL", "Liderança"] },
  { title: "Analista de Dados Pleno", department: "Dados", location: "Belo Horizonte, MG", workModel: "Híbrido", seniority: "Pleno", status: "Aberta", requiredSkills: ["SQL", "Python", "Power BI", "Estatística"] },
  { title: "Executivo(a) de Contas — Vendas", department: "Vendas", location: "Rio de Janeiro, RJ", workModel: "Presencial", seniority: "Pleno", status: "Aberta", requiredSkills: ["Negociação", "CRM", "Prospecção", "SaaS"] },
  { title: "Engenheiro(a) de Software Backend", department: "Engenharia", location: "Curitiba, PR", workModel: "Híbrido", seniority: "Pleno", status: "Aberta", requiredSkills: ["Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker"] },
  { title: "Business Partner de RH", department: "RH", location: "São Paulo, SP", workModel: "Híbrido", seniority: "Sênior", status: "Fechada", requiredSkills: ["People Analytics", "Clima Organizacional", "Liderança"] },
  { title: "Especialista em Customer Success", department: "Customer Success", location: "Remoto", workModel: "Remoto", seniority: "Especialista", status: "Aberta", requiredSkills: ["Onboarding", "Retenção", "CRM", "Liderança"] },
  { title: "UX Researcher", department: "Design", location: "Remoto", workModel: "Remoto", seniority: "Pleno", status: "Aberta", requiredSkills: ["Pesquisa", "Entrevistas", "Figma", "Análise Qualitativa"] },
];

const firstNames = ["Ana", "Bruno", "Camila", "Daniel", "Elisa", "Felipe", "Giovana", "Hugo", "Isabela", "João", "Karen", "Lucas", "Marina", "Nicolas", "Olivia", "Paulo", "Rafaela", "Samuel", "Tatiana", "Victor"];
const surnames = ["Silva", "Costa", "Rocha", "Martins", "Souza", "Lima", "Alves", "Pereira", "Ramos", "Santos", "Oliveira", "Freitas", "Nunes", "Melo", "Castro"];
const places = ["São Paulo, SP", "Remoto", "Rio de Janeiro, RJ", "Curitiba, PR", "Belo Horizonte, MG", "Porto Alegre, RS", "Recife, PE", "Florianópolis, SC"];
const extraSkills = ["Comunicação", "Liderança", "Inglês Avançado", "Gestão de Projetos", "Excel", "Scrum", "Kanban"];

const db = {
  candidates: [],
  vacancies: [],
  applications: [],
  employees: [],
  onboardings: [],
  consultingLeads: [],
  insights: [],
  documents: [],
};

const LIFECYCLE_STAGES = ["Recruitment", "Onboarding", "Development", "Performance", "Offboarding"];

const employeeSeeds = [
  { name: "Ana Costa", role: "CEO", area: "Leadership", country: "Portugal", startDate: "2023-01-15", manager: "—", contract: "Full-time", status: "Active", lifecycle: "Development" },
  { name: "Beatriz Rodrigues", role: "HR Manager", area: "People", country: "Portugal", startDate: "2023-03-01", manager: "Ana Costa", contract: "Full-time", status: "Active", lifecycle: "Development" },
  { name: "Pedro Lima", role: "Head of Product", area: "Product", country: "Portugal", startDate: "2023-06-12", manager: "Ana Costa", contract: "Full-time", status: "Active", lifecycle: "Development" },
  { name: "Joana Esteves", role: "Senior Engineer", area: "Tech", country: "Portugal", startDate: "2024-01-08", manager: "Pedro Lima", contract: "Full-time", status: "Active", lifecycle: "Performance" },
  { name: "Tiago Neves", role: "Growth Marketer", area: "Marketing", country: "Spain", startDate: "2024-04-15", manager: "Ana Costa", contract: "Full-time", status: "Active", lifecycle: "Onboarding" },
  { name: "Luísa Barros", role: "Sales Executive", area: "Sales", country: "Portugal", startDate: "2024-08-01", manager: "Ana Costa", contract: "Part-time", status: "Active", lifecycle: "Onboarding" },
  { name: "Rui Antunes", role: "Frontend Engineer", area: "Tech", country: "Portugal", startDate: "2023-09-20", manager: "Pedro Lima", contract: "Full-time", status: "Offboarding", lifecycle: "Offboarding" },
];

const onboardingSeeds = [
  {
    employeeName: "Tiago Neves",
    role: "Growth Marketer",
    startDate: "2026-08-15",
    status: "In Progress",
    checklist: {
      before: [
        { label: "Contrato assinado", done: true },
        { label: "Acessos criados (email, Slack, ferramentas)", done: true },
        { label: "Equipamento preparado", done: true },
        { label: "Welcome email enviado", done: true },
      ],
      day1: [
        { label: "Welcome meeting com HR", done: true },
        { label: "Apresentação à equipa", done: true },
        { label: "Tour cultura & valores", done: true },
        { label: "Setup ferramentas", done: false },
      ],
      week1: [
        { label: "Follow-up 1:1 com manager", done: false },
        { label: "Feedback do novo colaborador", done: false },
        { label: "30-day plan alinhado", done: false },
      ],
    },
  },
  {
    employeeName: "Luísa Barros",
    role: "Sales Executive",
    startDate: "2026-08-22",
    status: "Started",
    checklist: {
      before: [
        { label: "Contrato assinado", done: true },
        { label: "Acessos criados (email, Slack, ferramentas)", done: true },
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
    },
  },
];

const consultingLeadSeeds = [
  { company: "Bright Labs", sector: "SaaS/Tech", size: "50–100", contact: "Marta Soares", need: "HR Setup + Onboarding", status: "Reunião agendada", value: "€3.500/mês" },
  { company: "GreenPath", sector: "Sustainability", size: "20–50", contact: "Jorge Faria", need: "Recruitment", status: "Proposta enviada", value: "€1.200/vaga" },
  { company: "NovaMed", sector: "HealthTech", size: "100+", contact: "Rita Antunes", need: "People Processes", status: "Em negociação", value: "€5.000/projeto" },
  { company: "UrbanMove", sector: "Mobility", size: "10–20", contact: "Paulo Cruz", need: "Talent Hunting", status: "Pesquisado", value: "—" },
  { company: "FinEdge", sector: "FinTech", size: "50–100", contact: "Sónia Alves", need: "HR Consulting", status: "Cliente", value: "€2.000/mês" },
];

const insightSeeds = [
  { type: "problem", text: "O processo de onboarding não tem um template padronizado — cada entrada é diferente.", area: "Onboarding" },
  { type: "opportunity", text: "Empresas do nosso network precisam de ajuda com HR Setup — oportunidade de negócio imediata.", area: "Consulting" },
  { type: "suggestion", text: "Implementar pulse surveys mensais para medir engagement antes da performance review.", area: "People" },
];

const CONSULTING_SERVICES = [
  { id: "recruitment", name: "Recruitment", desc: "Atração e seleção de talento para empresas parceiras", price: "€800–2.400/vaga", icon: "🎯" },
  { id: "talent-hunting", name: "Talent Hunting", desc: "Pesquisa proativa de perfis estratégicos e headhunting", price: "€1.200–3.000/vaga", icon: "🕵️" },
  { id: "hr-setup", name: "HR Setup", desc: "Criação de processos e estrutura de RH do zero", price: "€2.500–6.000/projeto", icon: "🏗️" },
  { id: "onboarding-design", name: "Onboarding Design", desc: "Desenho e implementação de programas de onboarding", price: "€1.500–3.500/projeto", icon: "🚀" },
  { id: "people-processes", name: "People Processes", desc: "Definição de OKRs, performance review e cultura", price: "€1.000–4.000/projeto", icon: "⚙️" },
];

function computeProgress(checklist) {
  const all = [...checklist.before, ...checklist.day1, ...checklist.week1];
  return all.length ? Math.round((all.filter((i) => i.done).length / all.length) * 100) : 0;
}

function seedExtras() {
  const baseDate = Date.now();

  db.employees = employeeSeeds.map((e, i) => ({
    id: uid(),
    ...e,
    createdAt: new Date(baseDate - (employeeSeeds.length - i) * 86_400_000 * 7).toISOString(),
    updatedAt: new Date(baseDate - (employeeSeeds.length - i) * 86_400_000 * 7).toISOString(),
  }));

  db.onboardings = onboardingSeeds.map((o, i) => {
    const createdAt = new Date(baseDate - (onboardingSeeds.length - i) * 86_400_000 * 3).toISOString();
    return { id: uid(), ...o, progress: computeProgress(o.checklist), createdAt, updatedAt: createdAt };
  });

  db.consultingLeads = consultingLeadSeeds.map((c, i) => {
    const createdAt = new Date(baseDate - (consultingLeadSeeds.length - i) * 86_400_000 * 4).toISOString();
    return { id: uid(), ...c, aiQualification: null, createdAt, updatedAt: createdAt };
  });

  db.insights = insightSeeds.map((ins, i) => {
    const createdAt = new Date(baseDate - (insightSeeds.length - i) * 86_400_000).toISOString();
    return { id: uid(), ...ins, source: "manual", date: createdAt.slice(0, 10), createdAt };
  });

  db.documents = [];

  // eslint-disable-next-line no-console
  console.log(`[seed] ${db.employees.length} colaboradores, ${db.onboardings.length} onboardings, ${db.consultingLeads.length} leads de consulting, ${db.insights.length} insights`);
}

function seed() {
  const allSkills = Array.from(new Set([...vacancySeeds.flatMap((v) => v.requiredSkills), ...extraSkills]));

  db.vacancies = vacancySeeds.map((seedItem, i) => {
    const createdAt = new Date(Date.now() - i * 86_400_000 * 3).toISOString();
    return {
      id: uid(),
      title: seedItem.title,
      department: seedItem.department,
      location: seedItem.location,
      workModel: seedItem.workModel,
      seniority: seedItem.seniority,
      status: seedItem.status,
      description: `Estamos em busca de ${seedItem.title} para se juntar ao time de ${seedItem.department}. Você atuará em iniciativas de alto impacto, colaborando com times multidisciplinares.`,
      responsibilities: "Planejar e executar entregas com autonomia; colaborar com áreas parceiras; propor melhorias contínuas de processo.",
      requirements: `Experiência prévia compatível com o nível ${seedItem.seniority}; domínio das competências listadas; boa comunicação.`,
      requiredSkills: seedItem.requiredSkills,
      stages: buildStages(DEFAULT_STAGES),
      createdAt,
      updatedAt: createdAt,
    };
  });

  let counter = 0;
  const makeCandidate = ({ vacancyId, stageId, biasSkills }) => {
    const seedIndex = counter++;
    const first = firstNames[seedIndex % firstNames.length];
    const last = surnames[Math.floor(seedIndex / firstNames.length) % surnames.length];
    const name = `${first} ${last}`;
    const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
    const bias = biasSkills.slice(0, 3);
    const rest = allSkills.filter((s) => !bias.includes(s)).slice(seedIndex % 5, (seedIndex % 5) + 3);
    const experienceYears = 1 + (seedIndex % 12);
    const createdAt = new Date(Date.now() - (1 + (seedIndex % 45)) * 86_400_000).toISOString();
    return {
      id: uid(),
      name,
      email: `${slug}${seedIndex + 1}@email.com`,
      phone: `+55 11 9${String(10000000 + seedIndex).slice(-8)}`,
      location: places[seedIndex % places.length],
      avatar: `https://i.pravatar.cc/120?img=${(seedIndex % 70) + 1}`,
      resumeUrl: null,
      resumeText: null,
      experience: [
        { company: "Empresa Anterior", role: "Cargo anterior", startDate: "2020", endDate: "2023", current: false, description: `${experienceYears} anos de experiência em entregas de alto impacto.` },
      ],
      education: [{ institution: "Universidade", degree: "Bacharelado", fieldOfStudy: "Área correlata", startYear: "2015", endYear: "2019" }],
      skills: [...bias, ...rest],
      languages: seedIndex % 3 === 0 ? ["Português", "Inglês"] : ["Português"],
      seniority: ["Júnior", "Pleno", "Sênior", "Especialista"][seedIndex % 4],
      linkedin: "",
      portfolio: "",
      notes: seedIndex % 3 === 0 ? "Perfil com excelente aderência cultural. Avaliar no próximo ciclo." : "Aguardando avaliação do time responsável.",
      vacancyId: vacancyId ?? null,
      createdAt,
      updatedAt: createdAt,
    };
  };

  db.vacancies.forEach((vacancy) => {
    const count = 4 + (vacancy.title.length % 5);
    for (let i = 0; i < count; i++) {
      const weightedIndex = Math.min(vacancy.stages.length - 1, Math.floor(Math.pow(Math.random(), 1.6) * vacancy.stages.length));
      const stage = vacancy.stages[weightedIndex] ?? vacancy.stages[0];
      const candidate = makeCandidate({ vacancyId: vacancy.id, stageId: stage.id, biasSkills: vacancy.requiredSkills });
      db.candidates.push(candidate);
      db.applications.push({
        id: uid(),
        candidateId: candidate.id,
        vacancyId: vacancy.id,
        currentStage: stage.name,
        matchScore: null,
        status: "ACTIVE",
        aiEvaluation: null,
        createdAt: candidate.createdAt,
        updatedAt: candidate.createdAt,
      });
    }
  });

  for (let i = 0; i < 40; i++) {
    db.candidates.push(makeCandidate({ vacancyId: null, stageId: null, biasSkills: allSkills.slice(i % 6, (i % 6) + 3) }));
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] ${db.vacancies.length} vagas, ${db.candidates.length} candidatos, ${db.applications.length} candidaturas`);

  seedExtras();
}

module.exports = { db, uid, now, seed, LIFECYCLE_STAGES, CONSULTING_SERVICES, computeProgress };
