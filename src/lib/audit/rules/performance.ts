import type { AuditRule } from "@/types/audit";

export const performanceRules: AuditRule[] = [
  {
    id: "PERF-001",
    category: "performance",
    severity: "critical",
    title: "Loop with HTTP Requests",
    description:
      "SplitInBatches nodes connected to HTTP Request nodes can cause performance issues with large datasets.",
    recommendation:
      "Consider using batch processing with appropriate batch sizes or native bulk API endpoints.",
    check(workflow, helpers) {
      const findings = [];
      const splitNodes = helpers.getNodesByType("splitInBatches");
      for (const splitNode of splitNodes) {
        const outgoing = helpers.getOutgoingConnections(splitNode.name);
        for (const conn of outgoing) {
          const target = helpers.getNodeByName(conn.node);
          if (
            target &&
            target.type.toLowerCase().includes("httprequest") &&
            !target.disabled
          ) {
            findings.push({
              id: `PERF-001-${splitNode.id}`,
              ruleId: "PERF-001",
              category: "performance" as const,
              severity: "critical" as const,
              title: "Loop with HTTP Requests",
              description: `"${splitNode.name}" feeds into HTTP Request "${target.name}". Each batch item triggers a separate HTTP call.`,
              recommendation: `Use a bulk API endpoint or increase batch size for "${splitNode.name}" to reduce the number of HTTP calls.`,
              affectedNodes: [splitNode.name, target.name],
              affectedNodeIds: [splitNode.id, target.id],
            });
          }
        }
      }
      return findings;
    },
  },
  {
    id: "PERF-002",
    category: "performance",
    severity: "warning",
    title: "Missing Batch Processing",
    description:
      "Large data sources feeding directly into per-item processing without batching.",
    recommendation:
      "Add a SplitInBatches node to process items in manageable chunks.",
    check(workflow, helpers) {
      const findings = [];
      const triggerNodes = helpers.getTriggerNodes();
      for (const trigger of triggerNodes) {
        const outgoing = helpers.getOutgoingConnections(trigger.name);
        for (const conn of outgoing) {
          const target = helpers.getNodeByName(conn.node);
          if (!target || target.disabled) continue;
          const isHttp = target.type.toLowerCase().includes("httprequest");
          const isCode =
            target.type.toLowerCase().includes("code") ||
            target.type.toLowerCase().includes("function");
          if (isHttp || isCode) {
            // Check if there's a SplitInBatches between trigger and this node
            const hasSplit = workflow.nodes.some(
              (n) =>
                n.type.toLowerCase().includes("splitinbatches") &&
                !n.disabled
            );
            if (!hasSplit && trigger.type.toLowerCase().includes("webhook")) {
              findings.push({
                id: `PERF-002-${target.id}`,
                ruleId: "PERF-002",
                category: "performance" as const,
                severity: "warning" as const,
                title: "Missing Batch Processing",
                description: `Webhook trigger "${trigger.name}" feeds directly into "${target.name}" without batch processing.`,
                recommendation: `Add a SplitInBatches node between "${trigger.name}" and "${target.name}" for large payloads.`,
                affectedNodes: [trigger.name, target.name],
                affectedNodeIds: [trigger.id, target.id],
              });
            }
          }
        }
      }
      return findings;
    },
  },
  {
    id: "PERF-003",
    category: "performance",
    severity: "info",
    title: "Sequential Nodes That Could Parallelize",
    description:
      "Multiple independent HTTP Request nodes run sequentially instead of in parallel.",
    recommendation:
      "Use parallel execution by connecting independent nodes to the same source output.",
    check(workflow, helpers) {
      const findings = [];
      const httpNodes = workflow.nodes.filter(
        (n) =>
          n.type.toLowerCase().includes("httprequest") && !n.disabled
      );

      for (let i = 0; i < httpNodes.length; i++) {
        for (let j = i + 1; j < httpNodes.length; j++) {
          const a = httpNodes[i];
          const b = httpNodes[j];
          // Check if a -> b is a direct connection (sequential)
          const aOutgoing = helpers.getOutgoingConnections(a.name);
          const isSequential = aOutgoing.some((c) => c.node === b.name);
          if (isSequential) {
            // Check if b depends on a's data (simplified: if b doesn't reference a's output)
            const bParams = helpers.stringifyParameters(b);
            if (!bParams.includes(a.name)) {
              findings.push({
                id: `PERF-003-${a.id}-${b.id}`,
                ruleId: "PERF-003",
                category: "performance" as const,
                severity: "info" as const,
                title: "Sequential Nodes That Could Parallelize",
                description: `"${a.name}" and "${b.name}" run sequentially but appear to be independent. They could run in parallel.`,
                recommendation: `Connect both "${a.name}" and "${b.name}" to the same parent node for parallel execution.`,
                affectedNodes: [a.name, b.name],
                affectedNodeIds: [a.id, b.id],
              });
            }
          }
        }
      }
      return findings;
    },
  },
  {
    id: "PERF-004",
    category: "performance",
    severity: "warning",
    title: "Duplicate Nodes",
    description:
      "Nodes with identical type and parameters are redundant and waste resources.",
    recommendation:
      "Merge duplicate nodes into one and route connections accordingly.",
    check(workflow) {
      const findings = [];
      const seen = new Map<string, string>();

      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const fingerprint = `${node.type}::${JSON.stringify(node.parameters)}`;
        const existing = seen.get(fingerprint);
        if (existing) {
          findings.push({
            id: `PERF-004-${node.id}`,
            ruleId: "PERF-004",
            category: "performance" as const,
            severity: "warning" as const,
            title: "Duplicate Nodes",
            description: `"${node.name}" has identical type and parameters as "${existing}".`,
            recommendation: `Consider merging "${node.name}" and "${existing}" into a single node.`,
            affectedNodes: [node.name, existing],
            affectedNodeIds: [node.id],
          });
        } else {
          seen.set(fingerprint, node.name);
        }
      }
      return findings;
    },
  },
  {
    id: "PERF-005",
    category: "performance",
    severity: "info",
    title: "Excessive Node Count",
    description:
      "Workflows with more than 50 nodes are complex and may be difficult to maintain and debug.",
    recommendation:
      "Consider splitting the workflow into sub-workflows using the Execute Workflow node.",
    check(workflow) {
      const activeNodes = workflow.nodes.filter((n) => !n.disabled);
      if (activeNodes.length > 50) {
        return [
          {
            id: "PERF-005-1",
            ruleId: "PERF-005",
            category: "performance" as const,
            severity: "info" as const,
            title: "Excessive Node Count",
            description: `Workflow has ${activeNodes.length} active nodes. Consider breaking it down.`,
            recommendation:
              "Split into sub-workflows using the Execute Workflow node for better maintainability.",
            metadata: { nodeCount: activeNodes.length },
          },
        ];
      }
      return [];
    },
  },
  {
    id: "PERF-006",
    category: "performance",
    severity: "warning",
    title: "Large Data Without Limit",
    description:
      "Database and API queries without LIMIT or pagination may return excessive data.",
    recommendation:
      "Add LIMIT clauses or pagination parameters to prevent memory issues.",
    check(workflow, helpers) {
      const findings = [];
      const dbTypes = ["postgres", "mysql", "mongodb", "microsoftSql"];
      for (const dbType of dbTypes) {
        const dbNodes = helpers.getNodesByType(dbType);
        for (const node of dbNodes) {
          if (node.disabled) continue;
          const params = helpers.stringifyParameters(node);
          const hasLimit =
            params.toLowerCase().includes("limit") ||
            params.toLowerCase().includes("top ");
          if (!hasLimit) {
            findings.push({
              id: `PERF-006-${node.id}`,
              ruleId: "PERF-006",
              category: "performance" as const,
              severity: "warning" as const,
              title: "Large Data Without Limit",
              description: `"${node.name}" (${node.type}) has no LIMIT or pagination configured.`,
              recommendation: `Add a LIMIT clause or pagination to "${node.name}" to prevent excessive data retrieval.`,
              affectedNodes: [node.name],
              affectedNodeIds: [node.id],
            });
          }
        }
      }
      return findings;
    },
  },
  {
    id: "PERF-007",
    category: "performance",
    severity: "warning",
    title: "Unused Code/Function Nodes",
    description:
      "Code or Function nodes whose output is not connected anywhere are wasted computation.",
    recommendation:
      "Remove unused nodes or connect their outputs to the workflow.",
    check(workflow, helpers) {
      const findings = [];
      const codeNodes = workflow.nodes.filter(
        (n) =>
          (n.type.toLowerCase().includes("code") ||
            n.type.toLowerCase().includes("function")) &&
          !n.disabled
      );
      for (const node of codeNodes) {
        const outgoing = helpers.getOutgoingConnections(node.name);
        if (outgoing.length === 0) {
          findings.push({
            id: `PERF-007-${node.id}`,
            ruleId: "PERF-007",
            category: "performance" as const,
            severity: "warning" as const,
            title: "Unused Code/Function Node",
            description: `"${node.name}" output is not connected to any node. Its computation is wasted.`,
            recommendation: `Connect "${node.name}" output or remove it if not needed.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
];
