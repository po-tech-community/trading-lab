/**
 * Custom API Error to handle HTTP status codes and API error responses.
 */
export class ApiError extends Error {
  public status: number;
  public data: Record<string, unknown> | undefined;

  constructor(status: number, message: string, data?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

import { env } from "./env";

/**
 * A reusable API abstraction using the native fetch API.
 * This can easily be swapped with Axios if needed.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const token = localStorage.getItem("accessToken");
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  const config: RequestInit = {
    ...options,
    signal: options.signal ?? controller.signal,
    credentials: options.credentials ?? "include",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${endpoint}`, config);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(
      response.status,
      errorData.message || "API Request Failed",
      errorData,
    );
  }

  // Handle No Content response
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}
