import type { AuditRule } from "@/types/audit";

export const complianceRules: AuditRule[] = [
  {
    id: "COMP-001",
    category: "compliance",
    severity: "warning",
    title: "Missing Audit Trail / Logging",
    description:
      "Workflow has no logging or audit trail nodes. Actions performed by the automation cannot be traced for compliance.",
    recommendation:
      "Add logging nodes (e.g., write to a database, Google Sheets, or a dedicated audit log) to record key workflow actions.",
    check(workflow) {
      const loggingIndicators = [
        "log",
        "audit",
        "spreadsheet",
        "googlesheets",
        "airtable",
        "postgres",
        "mysql",
        "mongodb",
      ];

      // Check if any node appears to be logging/recording actions
      const hasLogging = workflow.nodes.some((n) => {
        if (n.disabled) return false;
        const type = n.type.toLowerCase();
        const name = n.name.toLowerCase();
        return loggingIndicators.some(
          (l) => type.includes(l) || name.includes(l)
        );
      });

      // Only flag if workflow has external actions but no logging
      const hasExternalActions = workflow.nodes.some((n) => {
        if (n.disabled) return false;
        const type = n.type.toLowerCase();
        return (
          type.includes("httprequest") ||
          type.includes("email") ||
          type.includes("slack") ||
          type.includes("stripe") ||
          type.includes("executecommand")
        );
      });

      if (hasExternalActions && !hasLogging) {
        return [
          {
            id: "COMP-001-1",
            ruleId: "COMP-001",
            category: "compliance" as const,
            severity: "warning" as const,
            title: "Missing Audit Trail / Logging",
            description:
              "Workflow performs external actions but has no audit logging. Actions cannot be traced or audited.",
            recommendation:
              "Add a logging mechanism (database write, spreadsheet, or audit log service) to record workflow actions for compliance.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "COMP-002",
    category: "compliance",
    severity: "warning",
    title: "No Human Approval for Critical Operations",
    description:
      "Workflow performs critical operations (payments, data deletion, external communications) without any human approval step.",
    recommendation:
      "Add a manual approval step (Wait for Webhook, Form, or Slack approval) before critical operations.",
    check(workflow, helpers) {
      const criticalOps = [
        "stripe",
        "paypal",
        "executecommand",
        "sendgrid",
        "twilio",
      ];

      const criticalNodes = workflow.nodes.filter(
        (n) =>
          !n.disabled &&
          criticalOps.some((t) => n.type.toLowerCase().includes(t))
      );

      if (criticalNodes.length === 0) return [];

      // Check for approval/wait nodes in the workflow
      const hasApproval = workflow.nodes.some((n) => {
        if (n.disabled) return false;
        const type = n.type.toLowerCase();
        const name = n.name.toLowerCase();
        return (
          type.includes("wait") ||
          type.includes("form") ||
          type.includes("manual") ||
          name.includes("approval") ||
          name.includes("review")
        );
      });

      if (!hasApproval) {
        return [
          {
            id: "COMP-002-1",
            ruleId: "COMP-002",
            category: "compliance" as const,
            severity: "warning" as const,
            title: "No Human Approval for Critical Operations",
            description: `Workflow has ${criticalNodes.length} critical operation(s) (${criticalNodes.map((n) => `"${n.name}"`).join(", ")}) without human approval.`,
            recommendation:
              "Add a Wait for Webhook, Form Trigger, or Slack approval node before critical operations.",
            affectedNodes: criticalNodes.map((n) => n.name),
            affectedNodeIds: criticalNodes.map((n) => n.id),
          },
        ];
      }
      return [];
    },
  },
  {
    id: "COMP-003",
    category: "compliance",
    severity: "info",
    title: "Untagged Workflow",
    description:
      "Workflow has no tags for governance. Tags help categorize workflows by client, department, environment, or risk level.",
    recommendation:
      "Add tags to the workflow (e.g., client name, environment, data classification) for governance and tracking.",
    check(workflow) {
      if (!workflow.tags || workflow.tags.length === 0) {
        return [
          {
            id: "COMP-003-1",
            ruleId: "COMP-003",
            category: "compliance" as const,
            severity: "info" as const,
            title: "Untagged Workflow",
            description:
              "Workflow has no tags. Tags are essential for governance, client tracking, and compliance categorization.",
            recommendation:
              "Add tags like client name, environment (prod/staging), data classification level, and department.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "COMP-004",
    category: "compliance",
    severity: "warning",
    title: "Missing Execution Timeout",
    description:
      "Workflow has no execution timeout configured. Long-running workflows can consume resources and indicate failures.",
    recommendation:
      "Set an executionTimeout in workflow settings to prevent runaway executions.",
    check(workflow) {
      if (!workflow.settings?.executionTimeout) {
        return [
          {
            id: "COMP-004-1",
            ruleId: "COMP-004",
            category: "compliance" as const,
            severity: "warning" as const,
            title: "Missing Execution Timeout",
            description:
              "No executionTimeout set. Workflows can run indefinitely, consuming resources and blocking execution queue.",
            recommendation:
              "Set executionTimeout in workflow settings (e.g., 300 seconds) to prevent runaway executions.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "COMP-005",
    category: "compliance",
    severity: "info",
    title: "No Execution Data Save Configuration",
    description:
      "Workflow does not specify whether to save execution data on success and error, making audit trail behavior unpredictable.",
    recommendation:
      "Configure saveDataErrorExecution and saveDataSuccessExecution in workflow settings for predictable audit trails.",
    check(workflow) {
      if (
        !workflow.settings?.saveDataErrorExecution ||
        !workflow.settings?.saveDataSuccessExecution
      ) {
        return [
          {
            id: "COMP-005-1",
            ruleId: "COMP-005",
            category: "compliance" as const,
            severity: "info" as const,
            title: "No Execution Data Save Configuration",
            description:
              "Execution data save settings not configured. Relies on instance defaults which may not meet compliance requirements.",
            recommendation:
              "Set saveDataErrorExecution to 'all' and configure saveDataSuccessExecution based on your data retention policy.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "COMP-006",
    category: "compliance",
    severity: "info",
    title: "Missing Workflow Documentation",
    description:
      "Workflow has no description or notes explaining its purpose, owner, or data handling procedures.",
    recommendation:
      "Add a sticky note or workflow description documenting the workflow's purpose, owner, data classification, and review date.",
    check(workflow) {
      const hasDescription = workflow.meta && Object.keys(workflow.meta).length > 0;
      const hasStickyNotes = workflow.nodes.some(
        (n) =>
          n.type.toLowerCase().includes("stickynote") ||
          n.type.toLowerCase().includes("sticky")
      );
      const hasNotedNodes = workflow.nodes.some((n) => n.notes);

      if (!hasDescription && !hasStickyNotes && !hasNotedNodes) {
        return [
          {
            id: "COMP-006-1",
            ruleId: "COMP-006",
            category: "compliance" as const,
            severity: "info" as const,
            title: "Missing Workflow Documentation",
            description:
              "Workflow has no documentation (no meta, no sticky notes, no node notes). Purpose and data handling are undocumented.",
            recommendation:
              "Add a Sticky Note describing: workflow purpose, data owner, data classification, last review date, and responsible team.",
          },
        ];
      }
      return [];
    },
  },
];
