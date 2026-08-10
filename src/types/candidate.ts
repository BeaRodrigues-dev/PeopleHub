export const STATUSES = ['Novo candidato','Screening','Entrevista RH','Entrevista Técnica','Proposta','Contratado','Rejeitado'] as const;
export type Status = typeof STATUSES[number];
export type ViewMode = 'kanban' | 'list';
export interface Filters { statuses: Status[]; seniorities: string[]; locations: string[]; salary: [number, number]; appliedFrom: string; }
export interface Candidate { id:string; name:string; email:string; phone:string; avatar:string; position:string; seniority:string; location:string; salary:number; status:Status; appliedAt:string; updatedAt:string; experience:string; skills:string[]; education:string; notes:string; company:string; }
export interface CandidatePage { items: Candidate[]; total: number; hasMore: boolean; }
