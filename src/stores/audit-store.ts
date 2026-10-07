import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { N8nWorkflow } from "@/types/n8n";
import type {
  AuditResult,
  AuditCategory,
  AIProvider,
  OptimizationResult,
} from "@/types/audit";
import { calculateCategoryScore, calculateOverallScore } from "@/lib/audit/scoring";

interface AuditState {
  rawJson: string | null;
  workflow: N8nWorkflow | null;
  parseError: string | null;

  auditResult: AuditResult | null;
  isAuditing: boolean;

  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  optimizationError: string | null;
  selectedProvider: AIProvider;

  setRawJson: (json: string) => void;
  setWorkflow: (workflow: N8nWorkflow) => void;
  setParseError: (error: string) => void;
  setAuditResult: (result: AuditResult) => void;
  setIsAuditing: (loading: boolean) => void;
  setOptimizationResult: (result: OptimizationResult | null) => void;
  setIsOptimizing: (loading: boolean) => void;
  setOptimizationError: (error: string | null) => void;
  setSelectedProvider: (provider: AIProvider) => void;
  reset: () => void;
}

const initialState = {
  rawJson: null,
  workflow: null,
  parseError: null,
  auditResult: null,
  isAuditing: false,
  optimizationResult: null,
  isOptimizing: false,
  optimizationError: null,
  selectedProvider: "gemini" as AIProvider,
};

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      ...initialState,

      setRawJson: (json) => set({ rawJson: json, parseError: null }),
      setWorkflow: (workflow) => set({ workflow, parseError: null }),
      setParseError: (error) => set({ parseError: error, workflow: null }),
      setAuditResult: (result) => set({ auditResult: result }),
      setIsAuditing: (loading) => set({ isAuditing: loading }),
      setOptimizationResult: (result) => set({ optimizationResult: result }),
      setIsOptimizing: (loading) => set({ isOptimizing: loading }),
      setOptimizationError: (error) => set({ optimizationError: error }),
      setSelectedProvider: (provider) => set({ selectedProvider: provider }),
      reset: () => set(initialState),
    }),
    {
      name: "audit-store",
      partialize: (state) => ({
        rawJson: state.rawJson,
        workflow: state.workflow,
        auditResult: state.auditResult,
        optimizationResult: state.optimizationResult,
        selectedProvider: state.selectedProvider,
      }),
      // Recalculate scores from persisted findings so formula changes apply immediately
      onRehydrateStorage: () => (state) => {
        if (!state?.auditResult) return;
        const result = state.auditResult;
        for (const key of Object.keys(result.categories) as AuditCategory[]) {
          const cat = result.categories[key];
          result.categories[key] = calculateCategoryScore(key, cat.findings);
        }
        result.overallScore = calculateOverallScore(result.categories);
      },
    }
  )
);
