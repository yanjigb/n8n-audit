"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Webhook,
  Clock,
  Globe,
  Code,
  GitBranch,
  Mail,
  Database,
  Zap,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/audit";

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  typeName: string;
  nodeType: string;
  disabled?: boolean;
  severity?: Severity | null;
  hasFindings: boolean;
  findingCount: number;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  webhook: Webhook,
  cron: Clock,
  schedule: Clock,
  trigger: Zap,
  httprequest: Globe,
  http: Globe,
  code: Code,
  function: Code,
  functionitem: Code,
  if: GitBranch,
  switch: GitBranch,
  merge: GitBranch,
  email: Mail,
  gmail: Mail,
  smtp: Mail,
  sendgrid: Mail,
  slack: Mail,
  telegram: Mail,
  discord: Mail,
  postgres: Database,
  mysql: Database,
  mongodb: Database,
  redis: Database,
};

function getNodeIcon(nodeType: string): LucideIcon {
  const lower = nodeType.toLowerCase();
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return Settings;
}

function getShortTypeName(fullType: string): string {
  // "n8n-nodes-base.httpRequest" → "HTTP Request"
  const lastPart = fullType.split(".").pop() ?? fullType;
  return lastPart
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-red-500 shadow-red-500/20",
  warning: "border-yellow-500 shadow-yellow-500/20",
  info: "border-blue-400 shadow-blue-400/20",
};

function CustomNodeComponent({ data }: NodeProps & { data: CustomNodeData }) {
  const Icon = getNodeIcon(data.nodeType);
  const shortType = data.typeName || getShortTypeName(data.nodeType);
  const borderClass = data.severity
    ? SEVERITY_BORDER[data.severity]
    : "border-border";

  return (
    <>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground/50" />
      <div
        className={cn(
          "rounded-lg border-2 bg-card px-3 py-2 shadow-sm min-w-[140px] max-w-[200px] transition-all",
          borderClass,
          data.disabled && "opacity-40"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center rounded-md p-1.5",
              data.severity === "critical"
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : data.severity === "warning"
                  ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-tight">
              {data.label}
            </p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {shortType}
            </p>
          </div>
        </div>
        {data.findingCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium",
                data.severity === "critical"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : data.severity === "warning"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              )}
            >
              {data.findingCount} issue{data.findingCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-2! h-2! bg-muted-foreground/50!" />
    </>
  );
}

export const CustomNode = memo(CustomNodeComponent);
export { getShortTypeName };
