import { API_BASE_URL } from 'constants/api';
import { useAuthStore } from '@/store/authStore';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const isUnauthorizedError = (error: unknown) =>
  error instanceof ApiError && error.status === 401;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const method = (options.method ?? 'GET').toUpperCase();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: method === 'GET' ? 'no-store' : options.cache,
    headers: {
      'Content-Type': 'application/json',
      ...(method === 'GET' ? { 'Cache-Control': 'no-cache' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401 && token) {
      await useAuthStore.getState().logout();
    }

    throw new ApiError(data.error ?? `HTTP ${res.status}`, res.status);
  }

  return data;
}
