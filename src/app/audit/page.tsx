"use client";

import { useRouter } from "next/navigation";
import { useAuditStore } from "@/stores/audit-store";
import { AuditSummary } from "@/components/audit/audit-summary";
import { WorkflowInfo } from "@/components/audit/workflow-info";
import { CategoryCard } from "@/components/audit/category-card";
import { ExportButton } from "@/components/export/export-button";
import { useTranslation } from "@/lib/i18n";
import type { AuditCategory } from "@/types/audit";

const CATEGORY_ROUTES: Record<AuditCategory, string> = {
  "error-handling": "/audit/error-handling",
  performance: "/audit/performance",
  security: "/audit/security",
  "best-practices": "/audit/best-practices",
  "ai-security": "/audit/ai-security",
  "data-privacy": "/audit/data-privacy",
  compliance: "/audit/compliance",
  "vendor-risk": "/audit/vendor-risk",
};

export default function AuditDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const auditResult = useAuditStore((s) => s.auditResult);

  if (!auditResult) return null;

  const categories = Object.values(auditResult.categories);

  return (
    <div className="space-y-6 ">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("audit.dashboard")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("audit.dashboardDesc")}
          </p>
        </div>
        <ExportButton />
      </div>

      <AuditSummary result={auditResult} />
      <WorkflowInfo meta={auditResult.workflowMeta} />

      <div>
        <h3 className="text-sm font-medium mb-3">{t("audit.categories")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.category}
              data={cat}
              onClick={() => router.push(CATEGORY_ROUTES[cat.category])}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
