import type { AuditResult } from "@/types/audit";

export function generateJsonReport(result: AuditResult): string {
  return JSON.stringify(
    {
      generatedAt: result.timestamp,
      overallScore: result.overallScore,
      summary: {
        totalFindings: result.totalFindings,
        critical: result.criticalFindings,
        warnings: result.warningFindings,
        info: result.infoFindings,
      },
      workflowMeta: result.workflowMeta,
      categories: Object.fromEntries(
        Object.entries(result.categories).map(([key, cat]) => [
          key,
          {
            score: cat.score,
            findings: cat.findings.map((f) => ({
              ruleId: f.ruleId,
              severity: f.severity,
              title: f.title,
              description: f.description,
              recommendation: f.recommendation,
              affectedNodes: f.affectedNodes,
            })),
          },
        ])
      ),
    },
    null,
    2
  );
}

export function downloadJsonReport(result: AuditResult) {
  const json = generateJsonReport(result);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `n8n-audit-${result.workflowMeta.name.replace(/\s+/g, "-").toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
