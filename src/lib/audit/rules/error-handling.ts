import type { AuditRule } from "@/types/audit";
import { EXTERNAL_CALL_TYPES, NOTIFICATION_TYPES } from "../constants";

export const errorHandlingRules: AuditRule[] = [
  {
    id: "ERR-001",
    category: "error-handling",
    severity: "critical",
    title: "Missing Error Workflow",
    description:
      "The workflow has no error workflow configured. If the workflow fails, no external notification or recovery will occur.",
    recommendation:
      "Set an error workflow in Workflow Settings to handle failures gracefully.",
    check(workflow) {
      if (!workflow.settings?.errorWorkflow) {
        return [
          {
            id: "ERR-001-1",
            ruleId: "ERR-001",
            category: "error-handling",
            severity: "critical",
            title: "Missing Error Workflow",
            description:
              "No error workflow is configured in workflow settings.",
            recommendation:
              "Go to Workflow Settings and set an error workflow to handle failures.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "ERR-002",
    category: "error-handling",
    severity: "warning",
    title: "No Error Trigger Node",
    description:
      "The workflow does not contain an Error Trigger node for catching errors.",
    recommendation:
      "Add an Error Trigger node to define what happens when the workflow encounters an error.",
    check(_workflow, helpers) {
      const errorTriggers = helpers.getNodesByType("errorTrigger");
      if (errorTriggers.length === 0) {
        return [
          {
            id: "ERR-002-1",
            ruleId: "ERR-002",
            category: "error-handling",
            severity: "warning",
            title: "No Error Trigger Node",
            description:
              "No Error Trigger node found. Consider adding one for in-workflow error handling.",
            recommendation:
              "Add an Error Trigger node to catch and handle errors within the workflow.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "ERR-003",
    category: "error-handling",
    severity: "warning",
    title: "Node Without Error Output",
    description:
      "Nodes making external calls should have error outputs connected.",
    recommendation:
      "Configure the node's 'On Error' setting and connect the error output to a handler.",
    check(workflow, helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isExternal = EXTERNAL_CALL_TYPES.some((t) =>
          node.type.toLowerCase().includes(t.toLowerCase())
        );
        if (!isExternal) continue;

        const hasError = helpers.hasErrorOutput(node.name);
        const hasOnError =
          node.onError === "continueErrorOutput" ||
          node.onError === "continueRegularOutput";

        if (!hasError && !hasOnError) {
          findings.push({
            id: `ERR-003-${node.id}`,
            ruleId: "ERR-003",
            category: "error-handling" as const,
            severity: "warning" as const,
            title: "Node Without Error Output",
            description: `"${node.name}" (${node.type}) makes external calls but has no error output connected.`,
            recommendation: `Set 'On Error' to 'Continue Error Output' for "${node.name}" and connect the error output.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "ERR-004",
    category: "error-handling",
    severity: "info",
    title: "Missing Continue-on-Fail Strategy",
    description:
      "External call nodes without continueOnFail or onError configured may halt the entire workflow on failure.",
    recommendation:
      "Configure continueOnFail or onError on nodes making external calls.",
    check(workflow, _helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isExternal = EXTERNAL_CALL_TYPES.some((t) =>
          node.type.toLowerCase().includes(t.toLowerCase())
        );
        if (!isExternal) continue;
        if (node.continueOnFail || node.onError) continue;

        findings.push({
          id: `ERR-004-${node.id}`,
          ruleId: "ERR-004",
          category: "error-handling" as const,
          severity: "info" as const,
          title: "Missing Continue-on-Fail Strategy",
          description: `"${node.name}" has no continueOnFail or onError configured. A failure will stop the workflow.`,
          recommendation: `Consider setting continueOnFail or onError for "${node.name}".`,
          affectedNodes: [node.name],
          affectedNodeIds: [node.id],
        });
      }
      return findings;
    },
  },
  {
    id: "ERR-005",
    category: "error-handling",
    severity: "critical",
    title: "No Failure Notification Path",
    description:
      "The workflow has no notification node connected to error paths.",
    recommendation:
      "Add a notification node (Slack, Email, etc.) to be notified when the workflow fails.",
    check(workflow, helpers) {
      const notificationNodes = workflow.nodes.filter((n) =>
        NOTIFICATION_TYPES.some((t) =>
          n.type.toLowerCase().includes(t.toLowerCase())
        )
      );

      // Check if any error trigger connects to a notification
      const errorTriggers = helpers.getNodesByType("errorTrigger");
      if (errorTriggers.length === 0 && notificationNodes.length === 0) {
        return [
          {
            id: "ERR-005-1",
            ruleId: "ERR-005",
            category: "error-handling" as const,
            severity: "critical" as const,
            title: "No Failure Notification Path",
            description:
              "No notification channel is set up for error scenarios. Failures will go unnoticed.",
            recommendation:
              "Add an Error Trigger node connected to a notification channel (Slack, Email, etc.).",
          },
        ];
      }

      if (errorTriggers.length > 0) {
        const hasNotificationPath = errorTriggers.some((trigger) => {
          const visited = new Set<string>();
          const queue = [trigger.name];
          while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);
            if (
              notificationNodes.some((n) => n.name === current) &&
              current !== trigger.name
            ) {
              return true;
            }
            const outgoing = helpers.getOutgoingConnections(current);
            for (const conn of outgoing) {
              queue.push(conn.node);
            }
          }
          return false;
        });

        if (!hasNotificationPath && notificationNodes.length > 0) {
          return [
            {
              id: "ERR-005-2",
              ruleId: "ERR-005",
              category: "error-handling" as const,
              severity: "warning" as const,
              title: "Error Trigger Not Connected to Notification",
              description:
                "Error Trigger exists but is not connected to any notification node.",
              recommendation:
                "Connect the Error Trigger output to a notification node.",
            },
          ];
        }
      }

      return [];
    },
  },
  {
    id: "ERR-006",
    category: "error-handling",
    severity: "warning",
    title: "Missing Retry Configuration",
    description:
      "HTTP Request nodes without retry configuration may fail on transient errors.",
    recommendation:
      "Enable retryOnFail for HTTP Request nodes that call external APIs.",
    check(_workflow, helpers) {
      const findings = [];
      const httpNodes = helpers.getNodesByType("httpRequest");
      for (const node of httpNodes) {
        if (node.disabled) continue;
        if (!node.retryOnFail) {
          findings.push({
            id: `ERR-006-${node.id}`,
            ruleId: "ERR-006",
            category: "error-handling" as const,
            severity: "warning" as const,
            title: "Missing Retry Configuration",
            description: `"${node.name}" has no retry configuration. Transient failures will not be retried.`,
            recommendation: `Enable retryOnFail for "${node.name}" to handle transient API errors.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "ERR-007",
    category: "error-handling",
    severity: "warning",
    title: "Dead-End Error Path",
    description:
      "Error output is connected but leads to a node with no further action (dead end). Errors are caught but not handled.",
    recommendation:
      "Ensure error paths lead to meaningful actions like notifications, logging, or recovery steps.",
    check(workflow, helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        if (
          node.onError !== "continueErrorOutput" &&
          !helpers.hasErrorOutput(node.name)
        )
          continue;

        // If node has error output, check what it connects to
        const outputs = workflow.connections[node.name];
        if (!outputs?.main?.[1]) continue;

        for (const conn of outputs.main[1]) {
          const target = helpers.getNodeByName(conn.node);
          if (!target) continue;
          const targetOutgoing = helpers.getOutgoingConnections(target.name);
          const isNoOp =
            target.type.toLowerCase().includes("noop") ||
            target.type.toLowerCase().includes("nooperation");

          if (targetOutgoing.length === 0 && !isNoOp) {
            // Check if it's a notification node (those are OK as terminal)
            const isNotification = NOTIFICATION_TYPES.some((t) =>
              target.type.toLowerCase().includes(t.toLowerCase())
            );
            if (!isNotification) {
              findings.push({
                id: `ERR-007-${node.id}-${target.id}`,
                ruleId: "ERR-007",
                category: "error-handling" as const,
                severity: "warning" as const,
                title: "Dead-End Error Path",
                description: `Error output from "${node.name}" goes to "${target.name}" which has no further actions. Errors are swallowed.`,
                recommendation: `Add a notification or logging step after "${target.name}" to properly handle errors from "${node.name}".`,
                affectedNodes: [node.name, target.name],
                affectedNodeIds: [node.id, target.id],
              });
            }
          }
        }
      }
      return findings;
    },
  },
  {
    id: "ERR-008",
    category: "error-handling",
    severity: "info",
    title: "No Timeout on External Calls",
    description:
      "HTTP Request nodes without explicit timeout may hang indefinitely if the external service is unresponsive.",
    recommendation:
      "Set a timeout value on HTTP Request nodes to prevent indefinite waiting.",
    check(_workflow, helpers) {
      const findings = [];
      const httpNodes = helpers.getNodesByType("httpRequest");
      for (const node of httpNodes) {
        if (node.disabled) continue;
        const params = node.parameters as Record<string, unknown>;
        const options = params.options as Record<string, unknown> | undefined;
        const hasTimeout =
          options?.timeout !== undefined || params.timeout !== undefined;

        if (!hasTimeout) {
          findings.push({
            id: `ERR-008-${node.id}`,
            ruleId: "ERR-008",
            category: "error-handling" as const,
            severity: "info" as const,
            title: "No Timeout on External Call",
            description: `"${node.name}" has no explicit timeout. May hang indefinitely if the external service is unresponsive.`,
            recommendation: `Set a timeout (e.g., 30000ms) on "${node.name}" to prevent indefinite waiting.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
];
