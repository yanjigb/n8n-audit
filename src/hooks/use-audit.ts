"use client";

import { useCallback, useState } from "react";
import { useAuditStore } from "@/stores/audit-store";
import { useLanguageStore } from "@/lib/i18n";
import { runAudit } from "@/lib/audit/engine";
import { translateAuditResult } from "@/lib/audit/finding-translations";
import type { AuditResult, AuditCategory, CategoryScore } from "@/types/audit";
import { CATEGORY_WEIGHTS } from "@/lib/audit/constants";
import { calculateCategoryScore } from "@/lib/audit/scoring";

/**
 * Merge static engine results with AI results.
 * - AI findings (localized) take priority over static findings for the same ruleId
 * - Static-only findings are kept as fallback
 * - Takes the lower score per category (stricter)
 */
function mergeResults(
  staticResult: AuditResult,
  aiResult: AuditResult
): AuditResult {
  const categories = {} as Record<AuditCategory, CategoryScore>;

  for (const key of Object.keys(staticResult.categories) as AuditCategory[]) {
    const staticCat = staticResult.categories[key];
    const aiCat = aiResult.categories[key];

    if (!aiCat || aiCat.findings.length === 0) {
      categories[key] = staticCat;
      continue;
    }

    // AI findings take priority. Add static findings only if AI didn't cover that ruleId.
    const aiRuleIds = new Set(aiCat.findings.map((f) => f.ruleId));
    const mergedFindings = [
      ...aiCat.findings,
      ...staticCat.findings.filter((f) => !aiRuleIds.has(f.ruleId)),
    ];

    // Recalculate score from actual merged findings instead of trusting AI scores
    categories[key] = calculateCategoryScore(key, mergedFindings);
  }

  // Recalculate overall score
  let weighted = 0;
  for (const [cat, data] of Object.entries(categories)) {
    weighted += data.score * (CATEGORY_WEIGHTS[cat as AuditCategory] ?? 0);
  }
  const overallScore = Math.round(weighted);

  const allFindings = Object.values(categories).flatMap((c) => c.findings);

  return {
    overallScore,
    categories,
    totalFindings: allFindings.length,
    criticalFindings: allFindings.filter((f) => f.severity === "critical")
      .length,
    warningFindings: allFindings.filter((f) => f.severity === "warning").length,
    infoFindings: allFindings.filter((f) => f.severity === "info").length,
    workflowMeta: staticResult.workflowMeta,
    timestamp: new Date().toISOString(),
  };
}

export function useAudit() {
  const {
    auditResult,
    isAuditing,
    workflow,
    selectedProvider,
    setAuditResult,
    setIsAuditing,
  } = useAuditStore();
  const locale = useLanguageStore((s) => s.locale);
  const [auditError, setAuditError] = useState<string | null>(null);

  const executeAudit = useCallback(
    async (apiKey: string) => {
      if (!workflow) return;
      setIsAuditing(true);
      setAuditError(null);

      try {
        // 1. Run static rule engine (47 rules, instant) and translate to locale
        const staticResult = translateAuditResult(runAudit(workflow), locale);

        // 2. Run AI audit with locale
        const response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflow,
            provider: selectedProvider,
            apiKey,
            locale,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Audit request failed");
        }

        const aiResult: AuditResult = await response.json();

        // 3. Merge: AI findings (localized) take priority, translated static as fallback
        const merged = mergeResults(staticResult, aiResult);
        setAuditResult(merged);
      } catch (err) {
        // If AI fails, still use translated static results
        if (workflow) {
          try {
            const staticResult = translateAuditResult(runAudit(workflow), locale);
            setAuditResult(staticResult);
          } catch {
            // static also failed
          }
        }
        setAuditError(
          err instanceof Error ? err.message : "Unknown error occurred"
        );
      } finally {
        setIsAuditing(false);
      }
    },
    [workflow, selectedProvider, locale, setAuditResult, setIsAuditing]
  );

  return { auditResult, isAuditing, auditError, executeAudit };
}
