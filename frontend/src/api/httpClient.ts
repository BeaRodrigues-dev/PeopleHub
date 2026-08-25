/**
 * Cliente HTTP mínimo sobre `fetch` (sem axios — projeto não tem essa
 * dependência instalada). Normaliza erros da API num formato único
 * (ApiError) e centraliza a base URL / JSON handling / upload de arquivos.
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message || response.statusText;
    throw new ApiError(message || "Erro inesperado na API", response.status, body);
  }
  return body as T;
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(path.replace(/^\//, ""), `${API_BASE_URL}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, String(v)));
      else url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export const httpClient = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return fetch(buildUrl(path, params)).then((r) => parseResponse<T>(r));
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(buildUrl(path), {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => parseResponse<T>(r));
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return fetch(buildUrl(path), {
      method: "PATCH",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => parseResponse<T>(r));
  },
  delete<T>(path: string): Promise<T> {
    return fetch(buildUrl(path), { method: "DELETE" }).then((r) => parseResponse<T>(r));
  },
  upload<T>(path: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(buildUrl(path), { method: "POST", body: formData }).then((r) => parseResponse<T>(r));
  },
};

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
/** Resolve URLs relativas retornadas pela API (ex.: /uploads/arquivo.pdf) para absolutas. */
export function resolveApiFileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path}`;
}
