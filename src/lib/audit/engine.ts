import type { N8nWorkflow } from "@/types/n8n";
import type { AuditCategory, AuditFinding, AuditResult, CategoryScore } from "@/types/audit";
import { buildHelpers } from "@/lib/n8n/helpers";
import { errorHandlingRules } from "./rules/error-handling";
import { performanceRules } from "./rules/performance";
import { securityRules } from "./rules/security";
import { bestPracticesRules } from "./rules/best-practices";
import { aiSecurityRules } from "./rules/ai-security";
import { dataPrivacyRules } from "./rules/data-privacy";
import { complianceRules } from "./rules/compliance";
import { vendorRiskRules } from "./rules/vendor-risk";
import { calculateCategoryScore, calculateOverallScore } from "./scoring";

const ALL_CATEGORIES: AuditCategory[] = [
  "error-handling",
  "performance",
  "security",
  "best-practices",
  "ai-security",
  "data-privacy",
  "compliance",
  "vendor-risk",
];

export function runAudit(workflow: N8nWorkflow): AuditResult {
  const helpers = buildHelpers(workflow);

  const allRules = [
    ...errorHandlingRules,
    ...performanceRules,
    ...securityRules,
    ...bestPracticesRules,
    ...aiSecurityRules,
    ...dataPrivacyRules,
    ...complianceRules,
    ...vendorRiskRules,
  ];

  const findingsByCategory = Object.fromEntries(
    ALL_CATEGORIES.map((cat) => [cat, [] as AuditFinding[]])
  ) as Record<AuditCategory, AuditFinding[]>;

  for (const rule of allRules) {
    const findings = rule.check(workflow, helpers);
    findingsByCategory[rule.category].push(...findings);
  }

  const categories = Object.fromEntries(
    ALL_CATEGORIES.map((cat) => [
      cat,
      calculateCategoryScore(cat, findingsByCategory[cat]),
    ])
  ) as Record<AuditCategory, CategoryScore>;

  const overallScore = calculateOverallScore(categories);
  const allFindings = Object.values(findingsByCategory).flat();

  return {
    overallScore,
    categories,
    totalFindings: allFindings.length,
    criticalFindings: allFindings.filter((f) => f.severity === "critical").length,
    warningFindings: allFindings.filter((f) => f.severity === "warning").length,
    infoFindings: allFindings.filter((f) => f.severity === "info").length,
    workflowMeta: {
      name: workflow.name,
      nodeCount: workflow.nodes.length,
      connectionCount: helpers.connectionCount,
      hasErrorWorkflow: !!workflow.settings?.errorWorkflow,
      isActive: workflow.active,
      complexityScore:
        helpers.connectionCount -
        workflow.nodes.filter((n) => !n.disabled).length +
        2,
    },
    timestamp: new Date().toISOString(),
  };
}
