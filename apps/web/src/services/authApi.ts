// export async function registerUser() {
//   throw new Error("TODO: implement registerUser in your branch");
// }

// export async function loginUser() {
//   throw new Error("TODO: implement loginUser in your branch");
// }

// export async function getCurrentUser() {
//   throw new Error("TODO: implement getCurrentUser in your branch");
// }

import { apiClient, setToken, clearToken } from "./apiClient";

type AuthResponse = {
  ok: true;
  user: { _id: string; name: string; email: string };
  token: string;
};

export async function registerUser(name: string, email: string, password: string) {
  const res = await apiClient.post<AuthResponse>("/api/auth/register", {
    name,
    email,
    password,
  });
  setToken(res.token);
  return res.user;
}

export async function loginUser(email: string, password: string) {
  const res = await apiClient.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  setToken(res.token);
  return res.user;
}

export async function getCurrentUser() {
  const res = await apiClient.get<{ ok: true; userId: string }>("/api/auth/me");
  return res.userId;
}

export function logoutUser() {
  clearToken();
}