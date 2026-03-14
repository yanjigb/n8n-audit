import type { N8nWorkflow } from "./n8n";
import type { WorkflowHelpers } from "@/lib/n8n/helpers";

export type AuditCategory =
  | "error-handling"
  | "performance"
  | "security"
  | "best-practices"
  | "ai-security"
  | "data-privacy"
  | "compliance"
  | "vendor-risk";

export type Severity = "critical" | "warning" | "info";

export interface AuditFinding {
  id: string;
  ruleId: string;
  category: AuditCategory;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  affectedNodes?: string[];
  affectedNodeIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface CategoryScore {
  category: AuditCategory;
  score: number;
  findings: AuditFinding[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export interface AuditResult {
  overallScore: number;
  categories: Record<AuditCategory, CategoryScore>;
  totalFindings: number;
  criticalFindings: number;
  warningFindings: number;
  infoFindings: number;
  workflowMeta: {
    name: string;
    nodeCount: number;
    connectionCount: number;
    hasErrorWorkflow: boolean;
    isActive: boolean;
    complexityScore: number;
  };
  timestamp: string;
}

export interface AuditRule {
  id: string;
  category: AuditCategory;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  check: (workflow: N8nWorkflow, helpers: WorkflowHelpers) => AuditFinding[];
}

export type AIProvider = "claude" | "gemini";

export interface OptimizationRequest {
  workflow: N8nWorkflow;
  auditResult: AuditResult;
  provider: AIProvider;
  apiKey: string;
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: AuditCategory;
  changes: string;
  affectedNodes?: string[];
}

export interface OptimizationResult {
  suggestions: OptimizationSuggestion[];
  optimizedWorkflow: N8nWorkflow;
  explanation: string;
  provider: AIProvider;
}
