"use client";

import { useAuth } from "./use-auth";
import { useCallback } from "react";

/**
 * Returns authenticated fetch helpers that automatically include the JWT token.
 */
export function useApi() {
  const { token } = useAuth();

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(url, { ...options, headers });
      return res;
    },
    [token],
  );

  const get = useCallback(
    async <T = unknown>(url: string): Promise<T> => {
      const res = await authFetch(url);
      if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
      return res.json();
    },
    [authFetch],
  );

  const post = useCallback(
    async <T = unknown>(url: string, body?: unknown): Promise<T> => {
      const res = await authFetch(url, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `POST ${url} failed: ${res.status}`);
      }
      return res.json();
    },
    [authFetch],
  );

  const patch = useCallback(
    async <T = unknown>(url: string, body?: unknown): Promise<T> => {
      const res = await authFetch(url, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`PATCH ${url} failed: ${res.status}`);
      return res.json();
    },
    [authFetch],
  );

  const del = useCallback(
    async <T = unknown>(url: string): Promise<T> => {
      const res = await authFetch(url, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `DELETE ${url} failed: ${res.status}`);
      }
      return res.json();
    },
    [authFetch],
  );

  return { authFetch, get, post, patch, del };
}
