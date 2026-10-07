"use client";

import type { Severity } from "@/types/audit";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

const SEVERITY_CONFIG: Record<
  Severity,
  { variant: "destructive" | "outline" | "secondary"; labelKey: string }
> = {
  critical: { variant: "destructive", labelKey: "audit.critical" },
  warning: { variant: "outline", labelKey: "audit.warning" },
  info: { variant: "secondary", labelKey: "audit.info" },
};

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { t } = useTranslation();
  const config = SEVERITY_CONFIG[severity];

  return (
    <Badge
      variant={config.variant}
      className={
        severity === "warning"
          ? "border-yellow-500/50 text-yellow-700 dark:text-yellow-400"
          : ""
      }
    >
      {t(config.labelKey)}
    </Badge>
  );
}
