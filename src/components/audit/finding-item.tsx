"use client";

import type { ReactNode } from "react";
import type { AuditFinding } from "@/types/audit";
import { SeverityBadge } from "./severity-badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n";

interface FindingItemProps {
  finding: AuditFinding;
  highlight?: string;
}

/** Split text by query and wrap matches in <mark> */
function highlightText(text: string, query: string): ReactNode {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function FindingItem({ finding, highlight = "" }: FindingItemProps) {
  const { t } = useTranslation();

  return (
    <AccordionItem value={finding.id}>
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 text-left">
          <SeverityBadge severity={finding.severity} />
          <div>
            <span className="text-xs text-muted-foreground mr-2">
              {highlightText(finding.ruleId, highlight)}
            </span>
            <span className="text-sm font-medium">
              {highlightText(finding.title, highlight)}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 pb-4 p-3">
        <p className="text-sm text-muted-foreground">
          {highlightText(finding.description, highlight)}
        </p>
        <div className="border border-blue-400 bg-blue-50 rounded-md p-3">
          <p className="text-xs font-bold text-blue-500 mb-1">{t("audit.recommendation")}</p>
          <p className="text-sm dark:text-black">{finding.recommendation}</p>
        </div>
        {finding.affectedNodes && finding.affectedNodes.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1 text-muted-foreground">
              {t("audit.affectedNodes")}
            </p>
            <div className="flex flex-wrap gap-1">
              {finding.affectedNodes.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full bg-black dark:bg-white dark:text-black text-white px-3 py-1 text-xs"
                >
                  {highlightText(name, highlight)}
                </span>
              ))}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
