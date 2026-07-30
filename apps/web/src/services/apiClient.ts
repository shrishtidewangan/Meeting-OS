// export type ApiClientOptions = {
//   baseUrl?: string;
// };

// export function createApiClient(_options: ApiClientOptions = {}) {
//   throw new Error("TODO: implement typed API client in your branch");
// }

const TOKEN_KEY = "meetingos_token";

export type ApiClientOptions = {
  baseUrl?: string;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? "http://localhost:3001";

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = getToken();

    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    const data = await res.json();

    if (!res.ok || data.ok === false) {
      const message = data?.error?.message ?? "Request failed";
      throw new Error(message);
    }

    return data as T;
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}

// Shared singleton instance used by authApi / meetingApi
export const apiClient = createApiClient();
