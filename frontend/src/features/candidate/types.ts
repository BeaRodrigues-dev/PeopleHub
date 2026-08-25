export interface ExperienceEntry {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface EducationEntry {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: string;
  endYear?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string | null;
  resumeUrl?: string | null;
  resumeText?: string | null;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  languages: string[];
  seniority?: string;
  linkedin?: string;
  portfolio?: string;
  notes?: string;
  vacancyId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateCandidateInput = Omit<Candidate, "id" | "createdAt" | "updatedAt">;
export type UpdateCandidateInput = Partial<CreateCandidateInput>;

export interface CandidateFilters {
  locations: string[];
  skills: string[];
}

export interface ParsedResume {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  seniority?: string;
  languages: string[];
  linkedin?: string;
  portfolio?: string;
}

export interface ResumeParseResult {
  extracted: ParsedResume;
  resumeUrl: string;
  resumeText: string;
}
