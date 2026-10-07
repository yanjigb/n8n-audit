"use client";

import { useState } from "react";
import type { N8nWorkflow } from "@/types/n8n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Download,
  Eye,
  Code,
  ArrowLeftRight,
  Layers,
  GitCompare,
} from "lucide-react";
import { WorkflowGraph } from "@/components/graph/workflow-graph";
import { useTranslation } from "@/lib/i18n";

interface OptimizedJsonViewerProps {
  original: N8nWorkflow;
  optimized?: N8nWorkflow;
}

function countConnections(wf: N8nWorkflow) {
  return Object.values(wf.connections ?? {}).flatMap((o) =>
    Object.values(o).flatMap((g) => g.flat())
  ).length;
}

export function OptimizedJsonViewer({
  original,
  optimized,
}: OptimizedJsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  if (!optimized) return null;

  const json = JSON.stringify(optimized, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${optimized.name ?? "workflow"}-optimized.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const origNodes = original.nodes?.length ?? 0;
  const optNodes = optimized.nodes?.length ?? 0;
  const nodesDiff = optNodes - origNodes;
  const origConns = countConnections(original);
  const optConns = countConnections(optimized);
  const connDiff = optConns - origConns;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {t("optimize.optimizedWorkflow")}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              {copied ? t("optimize.copied") : t("optimize.copyJson")}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {t("optimize.downloadJson")}
            </Button>
          </div>
        </div>

        {/* Stats comparison */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {t("optimize.before")}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold">{origNodes}</span>
              <span className="text-xs text-muted-foreground">
                {t("common.nodes")}
              </span>
              <span className="text-lg font-bold">{origConns}</span>
              <span className="text-xs text-muted-foreground">
                {t("common.connections")}
              </span>
            </div>
          </div>
          <div className="rounded-lg border bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {t("optimize.after")}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold">{optNodes}</span>
              <span className="text-xs text-muted-foreground">
                {t("common.nodes")}
              </span>
              <span className="text-lg font-bold">{optConns}</span>
              <span className="text-xs text-muted-foreground">
                {t("common.connections")}
              </span>
              {nodesDiff !== 0 && (
                <Badge variant="outline" className="text-xs">
                  {nodesDiff > 0 ? `+${nodesDiff}` : nodesDiff}{" "}
                  {t("common.nodes")}
                </Badge>
              )}
              {connDiff !== 0 && (
                <Badge variant="outline" className="text-xs">
                  {connDiff > 0 ? `+${connDiff}` : connDiff}{" "}
                  {t("common.connections")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="preview">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {t("optimize.preview")}
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-1.5">
              <Code className="h-3.5 w-3.5" />
              {t("optimize.json")}
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-1.5">
              <GitCompare className="h-3.5 w-3.5" />
              {t("optimize.compare")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <div className="h-[500px] rounded-lg border">
              <WorkflowGraph workflow={optimized} />
            </div>
          </TabsContent>

          <TabsContent value="json">
            <ScrollArea className="h-[500px] rounded-lg border bg-muted/30">
              <pre className="p-4 text-xs font-mono leading-relaxed">{json}</pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compare">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3 w-3" />
                  {t("optimize.original")}
                </p>
                <div className="h-[450px] rounded-lg border">
                  <WorkflowGraph workflow={original} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3 w-3" />
                  {t("optimize.optimized")}
                </p>
                <div className="h-[450px] rounded-lg border">
                  <WorkflowGraph workflow={optimized} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
