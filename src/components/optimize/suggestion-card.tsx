"use client";

import { useState } from "react";
import type { OptimizationSuggestion } from "@/types/audit";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL_KEYS } from "@/lib/audit/constants";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "@/lib/i18n";
import {
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

interface SuggestionCardProps {
  suggestion: OptimizationSuggestion;
  index: number;
}

const IMPACT_CONFIG: Record<
  string,
  { color: string; border: string; icon: typeof ArrowUp; label: string }
> = {
  high: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    border: "border-l-red-500",
    icon: ArrowUp,
    label: "optimize.highImpact",
  },
  medium: {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    border: "border-l-amber-500",
    icon: ArrowRight,
    label: "optimize.medImpact",
  },
  low: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    border: "border-l-blue-500",
    icon: ArrowDown,
    label: "optimize.lowImpact",
  },
};

export function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const config = IMPACT_CONFIG[suggestion.impact] ?? IMPACT_CONFIG.low;
  const ImpactIcon = config.icon;

  return (
    <Card className={`border-l-4 ${config.border} overflow-hidden`}>
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold">
            {index}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="text-sm font-semibold leading-tight">
                {suggestion.title}
              </h4>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${config.color}`}
              >
                <ImpactIcon className="h-3 w-3" />
                {t(config.label)}
              </span>
              <Badge variant="outline" className="text-xs">
                {t(CATEGORY_LABEL_KEYS[suggestion.category])}
              </Badge>
            </div>
          </div>
          <div className="shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <ReactMarkdown>{suggestion.description}</ReactMarkdown>
          </div>

          <div className="rounded-md p-3 space-y-1 border border-blue-400 bg-blue-50">
            <p className="text-xs font-bold text-blue-500">
              {t("optimize.changes")}
            </p>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{suggestion.changes}</ReactMarkdown>
            </div>
          </div>

          {suggestion.affectedNodes && suggestion.affectedNodes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground font-medium">
                {t("optimize.affectedNodes")}:
              </span>
              {suggestion.affectedNodes.map((node) => (
                <Badge
                  key={node}
                  className="text-xs font-mono"
                >
                  {node}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
