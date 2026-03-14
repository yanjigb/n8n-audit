"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { N8nWorkflow } from "@/types/n8n";
import type { AuditResult, Severity } from "@/types/audit";
import { CustomNode, getShortTypeName } from "./custom-node";
import type { CustomNodeData } from "./custom-node";

interface WorkflowGraphProps {
  workflow: N8nWorkflow;
  auditResult?: AuditResult | null;
}

const nodeTypes = { custom: CustomNode };

function getNodeSeverity(
  nodeName: string,
  auditResult?: AuditResult | null
): { severity: Severity | null; count: number } {
  if (!auditResult) return { severity: null, count: 0 };

  const allFindings = Object.values(auditResult.categories).flatMap(
    (c) => c.findings
  );
  const nodeFindings = allFindings.filter(
    (f) => f.affectedNodes?.includes(nodeName)
  );

  if (nodeFindings.length === 0) return { severity: null, count: 0 };

  const hasCritical = nodeFindings.some((f) => f.severity === "critical");
  const hasWarning = nodeFindings.some((f) => f.severity === "warning");

  return {
    severity: hasCritical ? "critical" : hasWarning ? "warning" : "info",
    count: nodeFindings.length,
  };
}

export function WorkflowGraph({ workflow, auditResult }: WorkflowGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node<CustomNodeData>[] = workflow.nodes.map((n8nNode) => {
      const { severity, count } = getNodeSeverity(n8nNode.name, auditResult);
      return {
        id: n8nNode.name,
        type: "custom",
        position: { x: n8nNode.position[0], y: n8nNode.position[1] },
        data: {
          label: n8nNode.name,
          typeName: getShortTypeName(n8nNode.type),
          nodeType: n8nNode.type,
          disabled: n8nNode.disabled,
          severity,
          hasFindings: count > 0,
          findingCount: count,
        },
      };
    });

    const flowEdges: Edge[] = [];
    let edgeId = 0;

    for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
      for (const [outputType, outputGroups] of Object.entries(outputs)) {
        for (let outputIdx = 0; outputIdx < outputGroups.length; outputIdx++) {
          const connections = outputGroups[outputIdx];
          if (!connections) continue;

          for (const conn of connections) {
            const isError =
              outputType !== "main" || outputIdx > 0;

            flowEdges.push({
              id: `e-${edgeId++}`,
              source: sourceName,
              target: conn.node,
              animated: isError,
              style: isError
                ? { stroke: "#ef4444", strokeDasharray: "5 5", strokeWidth: 2 }
                : { stroke: "var(--color-muted-foreground)", strokeWidth: 1.5 },
              label: isError ? "error" : undefined,
              labelStyle: isError
                ? { fill: "#ef4444", fontSize: 10, fontWeight: 500 }
                : undefined,
            });
          }
        }
      }
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [workflow, auditResult]);

  return (
    <div className="w-full h-full rounded-lg border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const data = node.data as CustomNodeData;
            if (data.disabled) return "#94a3b8";
            if (data.severity === "critical") return "#ef4444";
            if (data.severity === "warning") return "#eab308";
            return "#22c55e";
          }}
          className="!bg-muted/50"
        />
      </ReactFlow>
    </div>
  );
}
