"use client";

import { useCallback, useState } from "react";
import type { AIProvider } from "@/types/audit";

const STORAGE_KEY = "audit-n8n-keys";

type KeyStore = Partial<Record<AIProvider, string>>;

function loadKeys(): KeyStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore invalid stored data
  }
  return {};
}

export function useApiKeys() {
  const [keys, setKeys] = useState<KeyStore>(loadKeys);

  const getKey = useCallback(
    (provider: AIProvider): string | null => {
      return keys[provider] ?? null;
    },
    [keys]
  );

  const setKey = useCallback(
    (provider: AIProvider, key: string) => {
      const updated = { ...keys, [provider]: key };
      setKeys(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [keys]
  );

  const removeKey = useCallback(
    (provider: AIProvider) => {
      const updated = { ...keys };
      delete updated[provider];
      setKeys(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [keys]
  );

  const hasKey = useCallback(
    (provider: AIProvider): boolean => {
      return !!keys[provider];
    },
    [keys]
  );

  return { getKey, setKey, removeKey, hasKey };
}
