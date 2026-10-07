"use client";

import { useCallback } from "react";
import { useAuditStore } from "@/stores/audit-store";
import { useLanguageStore } from "@/lib/i18n";
import type { OptimizationResult } from "@/types/audit";

export function useAiOptimization() {
  const {
    workflow,
    auditResult,
    selectedProvider,
    optimizationResult,
    isOptimizing,
    optimizationError,
    setOptimizationResult,
    setIsOptimizing,
    setOptimizationError,
    setSelectedProvider,
  } = useAuditStore();
  const locale = useLanguageStore((s) => s.locale);

  const optimize = useCallback(
    async (apiKey: string) => {
      if (!workflow) {
        setOptimizationError("No workflow loaded. Please upload a workflow first.");
        return;
      }
      if (!auditResult) {
        setOptimizationError("No audit results available. Please run an audit first.");
        return;
      }

      setIsOptimizing(true);
      setOptimizationError(null);
      setOptimizationResult(null);

      try {
        const response = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflow,
            auditResult,
            provider: selectedProvider,
            apiKey,
            locale,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Optimization request failed");
        }

        const result: OptimizationResult = await response.json();
        setOptimizationResult(result);
      } catch (err) {
        setOptimizationError(
          err instanceof Error ? err.message : "Unknown error occurred"
        );
      } finally {
        setIsOptimizing(false);
      }
    },
    [
      workflow,
      auditResult,
      selectedProvider,
      locale,
      setOptimizationResult,
      setIsOptimizing,
      setOptimizationError,
    ]
  );

  return {
    optimizationResult,
    isOptimizing,
    optimizationError,
    selectedProvider,
    setSelectedProvider,
    optimize,
  };
}
