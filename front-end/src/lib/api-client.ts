/**
 * Custom API Error to handle HTTP status codes and API error responses.
 */
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

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

  const config: RequestInit = {
    ...options,
    credentials: options.credentials ?? "include",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}${endpoint}`,
    config,
  );

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
