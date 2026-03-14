"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ProviderSelector } from "./provider-selector";
import { ApiKeyInput } from "./api-key-input";
import { SuggestionCard } from "./suggestion-card";
// import { OptimizedJsonViewer } from "./optimized-json-viewer";
import { useAiOptimization } from "@/hooks/use-ai-optimization";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useAuditStore } from "@/stores/audit-store";
import { useTranslation } from "@/lib/i18n";
import type { OptimizationSuggestion } from "@/types/audit";

function groupByImpact(suggestions: OptimizationSuggestion[]) {
  const high = suggestions.filter((s) => s.impact === "high");
  const medium = suggestions.filter((s) => s.impact === "medium");
  const low = suggestions.filter((s) => s.impact === "low");
  return { high, medium, low };
}

const IMPACT_HEADERS: Record<
  string,
  { icon: typeof ArrowUp; label: string; color: string }
> = {
  high: {
    icon: ArrowUp,
    label: "optimize.highImpact",
    color: "text-red-600 dark:text-red-400",
  },
  medium: {
    icon: ArrowRight,
    label: "optimize.medImpact",
    color: "text-amber-600 dark:text-amber-400",
  },
  low: {
    icon: ArrowDown,
    label: "optimize.lowImpact",
    color: "text-blue-600 dark:text-blue-400",
  },
};

export function OptimizationPanel() {
  const workflow = useAuditStore((s) => s.workflow);
  const {
    optimizationResult,
    isOptimizing,
    optimizationError,
    selectedProvider,
    setSelectedProvider,
    optimize,
  } = useAiOptimization();
  const { getKey, setKey } = useApiKeys();
  const [localKey, setLocalKey] = useState("");
  const { t } = useTranslation();

  // Sync API key from localStorage after useApiKeys hydrates
  useEffect(() => {
    const stored = getKey(selectedProvider);
    if (stored) setLocalKey(stored);
  }, [getKey, selectedProvider]);

  const handleProviderChange = (provider: typeof selectedProvider) => {
    setSelectedProvider(provider);
    setLocalKey(getKey(provider) ?? "");
  };

  const handleOptimize = () => {
    if (!localKey.trim()) return;
    setKey(selectedProvider, localKey);
    optimize(localKey);
  };

  const groups = optimizationResult
    ? groupByImpact(optimizationResult.suggestions)
    : null;

  let suggestionIndex = 0;

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t("optimize.settings")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProviderSelector
            value={selectedProvider}
            onChange={handleProviderChange}
          />
          <ApiKeyInput
            provider={selectedProvider}
            value={localKey}
            onChange={setLocalKey}
          />
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing || !localKey.trim()}
            className="w-full"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("optimize.analyzing")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t("optimize.run")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {optimizationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{optimizationError}</AlertDescription>
        </Alert>
      )}

      {optimizationResult && (
        <>
          {/* Summary — always expanded */}
          {optimizationResult.explanation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {t("optimize.summary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <ReactMarkdown>
                    {optimizationResult.explanation}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions grouped by impact */}
          {optimizationResult.suggestions.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold">
                {t("optimize.suggestions")} (
                {optimizationResult.suggestions.length})
              </h3>

              {(["high", "medium", "low"] as const).map((impact) => {
                const items = groups?.[impact] ?? [];
                if (items.length === 0) return null;
                const config = IMPACT_HEADERS[impact];
                const Icon = config.icon;

                return (
                  <div key={impact} className="space-y-3">
                    <div
                      className={`flex items-center gap-2 ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                      <h4 className="text-sm font-medium">
                        {t(config.label)} ({items.length})
                      </h4>
                    </div>
                    {items.map((s) => {
                      suggestionIndex++;
                      return (
                        <SuggestionCard
                          key={s.id}
                          suggestion={s}
                          index={suggestionIndex}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {optimizationResult.suggestions.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {t("optimize.noSuggestions")}
              </CardContent>
            </Card>
          )}

          {/* Optimized Workflow JSON Viewer */}
          {/* {workflow && (
            <OptimizedJsonViewer
              original={workflow}
              optimized={optimizationResult.optimizedWorkflow}
            />
          )} */}
        </>
      )}
    </div>
  );
}
