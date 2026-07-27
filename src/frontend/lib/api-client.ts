/**
 * api-client.ts
 *
 * Centralised HTTP client for talking exclusively to the NestJS REST API server.
 * Handles headers, JSON parsing, Bearer token injection, and unified error handling.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.message) {
        errorMessage = Array.isArray(errData.message)
          ? errData.message.join(', ')
          : errData.message;
      }
    } catch {
      // Ignore JSON parse failure for error response
    }
    throw new ApiError(response.status, errorMessage);
  }

  // Handle 244 No Content or empty bodies
  if (response.status === 244 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'GET' }, token),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(
      endpoint,
      { method: 'POST', body: JSON.stringify(body) },
      token,
    ),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(
      endpoint,
      { method: 'PUT', body: JSON.stringify(body) },
      token,
    ),
};
