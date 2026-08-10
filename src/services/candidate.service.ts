import { mockCandidates } from "../data/candidates.mock";
import type {
  Candidate,
  CandidatePage,
  Filters,
  Status,
} from "../types/candidate";

const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));
let database = [...mockCandidates];
const matches = (
  c: Candidate,
  query: string,
  filters: Filters,
  status?: Status,
) => {
  const q = query.trim().toLowerCase();
  const text = [c.name, c.email, c.position, c.company].join(" ").toLowerCase();
  return (
    (!q || text.includes(q)) &&
    (!status || c.status === status) &&
    (!filters.statuses.length || filters.statuses.includes(c.status)) &&
    (!filters.seniorities.length ||
      filters.seniorities.includes(c.seniority)) &&
    (!filters.locations.length || filters.locations.includes(c.location)) &&
    c.salary >= filters.salary[0] &&
    c.salary <= filters.salary[1] &&
    (!filters.appliedFrom || c.appliedAt >= filters.appliedFrom)
  );
};

export const candidateService = {
  async getCandidates({
    page = 0,
    limit = 24,
    query = "",
    filters,
    status,
  }: {
    page?: number;
    limit?: number;
    query?: string;
    filters: Filters;
    status?: Status;
  }): Promise<CandidatePage> {
    await delay(page ? 850 : 700);
    const all = database.filter((c) => matches(c, query, filters, status));
    const items = all.slice(page * limit, (page + 1) * limit);
    return {
      items,
      total: all.length,
      hasMore: (page + 1) * limit < all.length,
    };
  },
  async getCandidateById(id: string) {
    await delay(700);
    return database.find((c) => c.id === id) ?? null;
  },
  async updateCandidateStatus(id: string, status: Status) {
    await delay(800);
    database = database.map((c) =>
      c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c,
    );
    return database.find((c) => c.id === id)!;
  },
  async getMoreCandidates(args: {
    page: number;
    limit?: number;
    query?: string;
    filters: Filters;
    status?: Status;
  }) {
    return this.getCandidates(args);
  },
};
