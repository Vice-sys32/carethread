import { ApiError, handleUnauthorized, isAuthPath } from "./errors";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  formData?: FormData;
  headers?: Record<string, string>;
  responseType?: "json" | "blob";
}

export async function request<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, formData, headers, responseType = "json" } = options;
  const url = new URL(path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url.toString(), {
    method,
    credentials: "include",
    headers: {
      ...(formData || body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  if (!res.ok) {
    let code = "REQUEST_FAILED";
    let message = `Request failed with status ${res.status}.`;
    try {
      const data = (await res.json()) as { error?: { code?: string; message?: string } };
      if (data?.error?.code) code = data.error.code;
      if (data?.error?.message) message = data.error.message;
    } catch {
      // Non-JSON error body; keep the fallback message.
    }
    if (res.status === 401 && !isAuthPath(path)) handleUnauthorized();
    throw new ApiError(res.status, code, message);
  }
  if (responseType === "blob") return (await res.blob()) as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
