import type { AuditRule } from "@/types/audit";
import { DEFAULT_NODE_NAMES } from "../constants";

export const bestPracticesRules: AuditRule[] = [
  {
    id: "BP-001",
    category: "best-practices",
    severity: "warning",
    title: "Default Node Names",
    description:
      "Nodes with default names make workflows hard to understand and maintain.",
    recommendation:
      "Rename nodes to describe their specific purpose in the workflow.",
    check(workflow) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isDefault = DEFAULT_NODE_NAMES.some(
          (d) => node.name === d || node.name.match(new RegExp(`^${d}\\d*$`))
        );
        if (isDefault) {
          findings.push({
            id: `BP-001-${node.id}`,
            ruleId: "BP-001",
            category: "best-practices" as const,
            severity: "warning" as const,
            title: "Default Node Name",
            description: `"${node.name}" still has its default name. This makes the workflow harder to understand.`,
            recommendation: `Rename "${node.name}" to describe its purpose (e.g., "Fetch User Data" instead of "HTTP Request").`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "BP-002",
    category: "best-practices",
    severity: "info",
    title: "Missing Node Notes",
    description:
      "Complex nodes without notes make it difficult for others to understand the workflow.",
    recommendation:
      "Add notes to Code, Function, and complex logic nodes explaining their purpose.",
    check(workflow) {
      const findings = [];
      const complexTypes = ["code", "function", "functionItem", "switch", "if"];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isComplex = complexTypes.some((t) =>
          node.type.toLowerCase().includes(t)
        );
        if (isComplex && !node.notes) {
          findings.push({
            id: `BP-002-${node.id}`,
            ruleId: "BP-002",
            category: "best-practices" as const,
            severity: "info" as const,
            title: "Missing Node Notes",
            description: `"${node.name}" (${node.type}) has no notes. Complex logic should be documented.`,
            recommendation: `Add notes to "${node.name}" explaining what it does and why.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "BP-003",
    category: "best-practices",
    severity: "warning",
    title: "High Workflow Complexity",
    description:
      "Workflows with high cyclomatic complexity are hard to test, debug, and maintain.",
    recommendation:
      "Break the workflow into smaller sub-workflows using Execute Workflow nodes.",
    check(workflow, helpers) {
      const nodes = workflow.nodes.filter((n) => !n.disabled).length;
      const connections = helpers.connectionCount;
      // Simplified cyclomatic complexity: edges - nodes + 2 * connected components
      const complexity = connections - nodes + 2;
      if (complexity > 15) {
        return [
          {
            id: "BP-003-1",
            ruleId: "BP-003",
            category: "best-practices" as const,
            severity: "warning" as const,
            title: "High Workflow Complexity",
            description: `Workflow cyclomatic complexity is ${complexity} (threshold: 15). This workflow is hard to maintain.`,
            recommendation:
              "Split into smaller sub-workflows using Execute Workflow nodes.",
            metadata: { complexity },
          },
        ];
      }
      return [];
    },
  },
  {
    id: "BP-004",
    category: "best-practices",
    severity: "info",
    title: "Deeply Nested Workflow",
    description:
      "Workflows with very deep node chains are hard to follow and debug.",
    recommendation:
      "Flatten the workflow or break deep chains into sub-workflows.",
    check(workflow, helpers) {
      let maxDepth = 0;
      for (const node of workflow.nodes) {
        const depth = helpers.getDepth(node.name);
        if (depth > maxDepth) maxDepth = depth;
      }
      if (maxDepth > 10) {
        return [
          {
            id: "BP-004-1",
            ruleId: "BP-004",
            category: "best-practices" as const,
            severity: "info" as const,
            title: "Deeply Nested Workflow",
            description: `Maximum node depth is ${maxDepth} (threshold: 10). Deep chains are hard to debug.`,
            recommendation:
              "Consider breaking deep chains into sub-workflows for clarity.",
            metadata: { maxDepth },
          },
        ];
      }
      return [];
    },
  },
  {
    id: "BP-005",
    category: "best-practices",
    severity: "info",
    title: "No Workflow Description",
    description:
      "The workflow name is generic or unclear, making it hard to identify its purpose.",
    recommendation:
      "Give the workflow a descriptive name that explains its purpose.",
    check(workflow) {
      const genericNames = [
        "my workflow",
        "untitled",
        "new workflow",
        "test",
        "workflow",
        "example",
      ];
      const isGeneric = genericNames.some(
        (g) => workflow.name.toLowerCase().trim() === g
      );
      if (isGeneric) {
        return [
          {
            id: "BP-005-1",
            ruleId: "BP-005",
            category: "best-practices" as const,
            severity: "info" as const,
            title: "No Workflow Description",
            description: `Workflow name "${workflow.name}" is generic and does not describe its purpose.`,
            recommendation:
              "Rename the workflow to describe what it does (e.g., 'Sync Shopify Orders to Airtable').",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "BP-006",
    category: "best-practices",
    severity: "info",
    title: "Disabled Nodes Left in Workflow",
    description:
      "Disabled nodes clutter the workflow canvas and may confuse team members.",
    recommendation:
      "Remove disabled nodes that are no longer needed, or add notes explaining why they are disabled.",
    check(workflow) {
      const disabledNodes = workflow.nodes.filter((n) => n.disabled);
      if (disabledNodes.length > 0) {
        return [
          {
            id: "BP-006-1",
            ruleId: "BP-006",
            category: "best-practices" as const,
            severity: "info" as const,
            title: "Disabled Nodes Left in Workflow",
            description: `${disabledNodes.length} disabled node(s): ${disabledNodes.map((n) => `"${n.name}"`).join(", ")}.`,
            recommendation:
              "Remove disabled nodes or add notes explaining why they are disabled.",
            affectedNodes: disabledNodes.map((n) => n.name),
            affectedNodeIds: disabledNodes.map((n) => n.id),
          },
        ];
      }
      return [];
    },
  },
  {
    id: "BP-007",
    category: "best-practices",
    severity: "info",
    title: "Missing Version Control Metadata",
    description:
      "The workflow has no version ID or metadata, making it hard to track changes.",
    recommendation:
      "Enable versioning in n8n settings to track workflow changes over time.",
    check(workflow) {
      if (!workflow.versionId && !workflow.meta) {
        return [
          {
            id: "BP-007-1",
            ruleId: "BP-007",
            category: "best-practices" as const,
            severity: "info" as const,
            title: "Missing Version Control Metadata",
            description:
              "Workflow has no versionId or meta fields. Changes cannot be tracked.",
            recommendation:
              "Enable workflow versioning in your n8n instance settings.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "BP-008",
    category: "best-practices",
    severity: "info",
    title: "Missing Workflow Tags",
    description:
      "Workflow has no tags for categorization. Tags help organize workflows by client, environment, or purpose.",
    recommendation:
      "Add tags to the workflow (e.g., client name, environment, department) for better organization.",
    check(workflow) {
      if (!workflow.tags || workflow.tags.length === 0) {
        return [
          {
            id: "BP-008-1",
            ruleId: "BP-008",
            category: "best-practices" as const,
            severity: "info" as const,
            title: "Missing Workflow Tags",
            description:
              "Workflow has no tags. Tags help organize and manage workflows across teams.",
            recommendation:
              "Add tags like client name, environment (prod/dev), and workflow category.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "BP-009",
    category: "best-practices",
    severity: "warning",
    title: "Orphan Nodes Detected",
    description:
      "Nodes that are not connected to any other node are unreachable and may indicate incomplete work.",
    recommendation:
      "Connect orphan nodes to the workflow or remove them if they are no longer needed.",
    check(workflow, helpers) {
      const orphans = helpers.getOrphanNodes().filter((n) => !n.disabled);
      if (orphans.length > 0) {
        return [
          {
            id: "BP-009-1",
            ruleId: "BP-009",
            category: "best-practices" as const,
            severity: "warning" as const,
            title: "Orphan Nodes Detected",
            description: `${orphans.length} orphan node(s) found: ${orphans.map((n) => `"${n.name}"`).join(", ")}. These nodes are not connected to any workflow path.`,
            recommendation:
              "Connect these nodes to the workflow or remove them if unused.",
            affectedNodes: orphans.map((n) => n.name),
            affectedNodeIds: orphans.map((n) => n.id),
          },
        ];
      }
      return [];
    },
  },
  {
    id: "BP-010",
    category: "best-practices",
    severity: "info",
    title: "Credential Sprawl",
    description:
      "Workflow uses many different credential types, making credential management complex.",
    recommendation:
      "Consolidate credential usage where possible and document all credentials used.",
    check(workflow) {
      const credTypes = new Set<string>();
      for (const node of workflow.nodes) {
        if (node.disabled || !node.credentials) continue;
        for (const credType of Object.keys(node.credentials)) {
          credTypes.add(credType);
        }
      }

      if (credTypes.size > 5) {
        return [
          {
            id: "BP-010-1",
            ruleId: "BP-010",
            category: "best-practices" as const,
            severity: "info" as const,
            title: "Credential Sprawl",
            description: `Workflow uses ${credTypes.size} different credential types: ${Array.from(credTypes).join(", ")}. Complex credential management.`,
            recommendation:
              "Document all credentials. Ensure each has an owner, rotation schedule, and appropriate access scope.",
            metadata: { credentialTypes: Array.from(credTypes) },
          },
        ];
      }
      return [];
    },
  },
];
