import type { Candidate, Status } from "../types/candidate";
import { STATUSES } from "../types/candidate";

const firstNames = ["Ana","Bruno","Camila","Daniel","Elisa","Felipe","Giovana","Hugo","Isabela","João","Karen","Lucas","Marina","Nicolas","Olivia","Paulo","Rafaela","Samuel","Tatiana","Victor"];
const surnames = ["Silva","Costa","Rocha","Martins","Souza","Lima","Alves","Pereira","Ramos","Santos","Oliveira","Freitas","Nunes","Melo","Castro","Azevedo","Dias","Barros","Gomes","Reis"];
const positions = [
  "Product Designer",
  "Software Engineer",
  "Product Manager",
  "Data Analyst",
  "Recruiter",
  "Frontend Engineer",
  "UX Researcher",
];
const companies = [
  "Nubank",
  "iFood",
  "Loft",
  "Mercado Livre",
  "Stone",
  "PicPay",
  "QuintoAndar",
];
const places = [
  "São Paulo, SP",
  "Remoto",
  "Rio de Janeiro, RJ",
  "Curitiba, PR",
  "Belo Horizonte, MG",
];
const levels = ["Júnior", "Pleno", "Sênior", "Especialista"];
const skills = [
  "React",
  "TypeScript",
  "Figma",
  "Node.js",
  "SQL",
  "Liderança",
  "Pesquisa",
  "Python",
];
export const mockCandidates: Candidate[] = Array.from(
  { length: 350 },
  (_, i) => {
    const n = `${firstNames[i % firstNames.length]} ${surnames[Math.floor(i / firstNames.length) % surnames.length]}`,
      position = positions[i % positions.length],
      status = STATUSES[i % STATUSES.length] as Status;
    const appliedAt = new Date(2026, 7 - (i % 8), 1 + (i % 27)).toISOString();
    return {
      id: `cand-${i + 1}`,
      name: n,
      email: `${n
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(" ", "")}${i + 1}@email.com`,
      phone: `+55 11 9${String(10000000 + i).slice(-8)}`,
      avatar: `https://i.pravatar.cc/120?img=${(i % 70) + 1}`,
      position,
      seniority: levels[i % levels.length],
      location: places[i % places.length],
      salary: 4500 + (i % 13) * 1300,
      status,
      appliedAt,
      updatedAt: new Date(new Date(appliedAt).getTime() + (i % 6) * 86_400_000).toISOString(),
      experience: `${3 + (i % 12)} anos de experiência em ${position}, com entregas de alto impacto em produtos digitais e times multidisciplinares.`,
      skills: [
        skills[i % skills.length],
        skills[(i + 2) % skills.length],
        skills[(i + 4) % skills.length],
      ],
      education: "Bacharelado em área correlata",
      notes:
        i % 3 === 0
          ? "Perfil com excelente aderência cultural. Avaliar no próximo ciclo."
          : "Aguardando avaliação do time responsável.",
      company: companies[i % companies.length],
    };
  },
);
