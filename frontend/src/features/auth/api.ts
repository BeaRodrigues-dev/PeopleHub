import { httpClient } from "../../api/httpClient";

interface LoginResponse {
  token: string;
  expiresAt: number;
  email: string;
}

export const authApi = {
  login: (email: string, password: string) => httpClient.post<LoginResponse>("auth/login", { email, password }),
  updateCredentials: (input: { currentPassword: string; newEmail?: string; newPassword?: string }) =>
    httpClient.patch<LoginResponse>("auth/credentials", input),
};
