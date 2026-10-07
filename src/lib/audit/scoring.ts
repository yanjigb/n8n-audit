import type { AuditCategory, AuditFinding, CategoryScore, Severity } from "@/types/audit";
import { CATEGORY_WEIGHTS, SEVERITY_DEDUCTIONS } from "./constants";

export function calculateCategoryScore(
  category: AuditCategory,
  findings: AuditFinding[]
): CategoryScore {
  let totalDeduction = 0;
  for (const finding of findings) {
    totalDeduction += SEVERITY_DEDUCTIONS[finding.severity];
  }
  // Exponential decay: diminishing returns so score never hits 0 when findings exist.
  // For small deductions (< ~30) this closely matches the old linear formula.
  // For large deductions it gradually approaches 0 instead of clamping.
  const score =
    findings.length === 0
      ? 100
      : Math.max(1, Math.round(100 * Math.exp(-totalDeduction / 100)));

  return {
    category,
    score,
    findings,
    criticalCount: findings.filter((f) => f.severity === "critical").length,
    warningCount: findings.filter((f) => f.severity === "warning").length,
    infoCount: findings.filter((f) => f.severity === "info").length,
  };
}

export function calculateOverallScore(
  categories: Record<AuditCategory, CategoryScore>
): number {
  let weighted = 0;
  for (const [cat, data] of Object.entries(categories)) {
    weighted += data.score * CATEGORY_WEIGHTS[cat as AuditCategory];
  }
  return Math.round(weighted);
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "destructive";
    case "warning":
      return "warning";
    case "info":
      return "secondary";
  }
}
