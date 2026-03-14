import type { AIProvider, OptimizationResult } from "@/types/audit";

export interface AIRequestBody {
  workflow: unknown;
  auditResult: unknown;
  provider: AIProvider;
  apiKey: string;
}

export interface AIProviderConfig {
  name: string;
  provider: AIProvider;
  placeholder: string;
  helpUrl: string;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    name: "Gemini 2.5 Flash (Google)",
    provider: "gemini",
    placeholder: "AIza...",
    helpUrl: "https://aistudio.google.com/apikey",
  },
  {
    name: "Claude Sonnet 4 (Anthropic)",
    provider: "claude",
    placeholder: "sk-ant-...",
    helpUrl: "https://console.anthropic.com/settings/keys",
  },
];

export type { OptimizationResult };
