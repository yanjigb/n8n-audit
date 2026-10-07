import type { AuditRule } from "@/types/audit";

// Node types that are AI/LLM related
const AI_NODE_TYPES = [
  "openai",
  "langchain",
  "anthropic",
  "huggingface",
  "cohere",
  "ai",
  "chatgpt",
  "gpt",
  "llm",
  "embeddings",
  "vectorstore",
  "agent",
  "chain",
  "textclassifier",
  "sentimentanalysis",
  "summarization",
  "mistral",
  "groq",
  "ollama",
  "gemini",
  "palm",
];

// Patterns indicating user-controlled input flowing into prompts
const USER_INPUT_EXPRESSIONS = [
  "$json",
  "$input",
  "$node",
  "{{",
  "$binary",
  "$body",
  "$query",
  "$params",
];

export const aiSecurityRules: AuditRule[] = [
  {
    id: "AI-001",
    category: "ai-security",
    severity: "critical",
    title: "Prompt Injection Risk",
    description:
      "AI/LLM nodes receive dynamic user input directly in prompts without sanitization, making them vulnerable to prompt injection attacks.",
    recommendation:
      "Sanitize and validate all user inputs before passing them to AI prompts. Use system prompts to establish boundaries.",
    check(workflow, helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isAiNode = AI_NODE_TYPES.some((t) =>
          node.type.toLowerCase().includes(t)
        );
        if (!isAiNode) continue;

        const params = helpers.stringifyParameters(node);
        const hasUserInput = USER_INPUT_EXPRESSIONS.some((expr) =>
          params.includes(expr)
        );

        if (hasUserInput) {
          // Check if there's any indication of sanitization (a Set/Code node before this)
          const incoming = helpers.getIncomingConnections(node.name);
          const hasSanitizer = incoming.some(({ fromNode }) => {
            const sourceNode = helpers.getNodeByName(fromNode);
            return (
              sourceNode &&
              (sourceNode.type.toLowerCase().includes("code") ||
                sourceNode.type.toLowerCase().includes("function"))
            );
          });

          if (!hasSanitizer) {
            findings.push({
              id: `AI-001-${node.id}`,
              ruleId: "AI-001",
              category: "ai-security" as const,
              severity: "critical" as const,
              title: "Prompt Injection Risk",
              description: `"${node.name}" receives dynamic input directly in its prompt without a sanitization step. This is vulnerable to prompt injection.`,
              recommendation: `Add a Code or Function node before "${node.name}" to sanitize and validate user input before it reaches the AI prompt.`,
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
    id: "AI-002",
    category: "ai-security",
    severity: "warning",
    title: "AI Output Used Without Validation",
    description:
      "AI/LLM output is passed directly to downstream nodes without validation or filtering.",
    recommendation:
      "Add validation logic after AI nodes to check output format, content safety, and data integrity before using it.",
    check(workflow, helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isAiNode = AI_NODE_TYPES.some((t) =>
          node.type.toLowerCase().includes(t)
        );
        if (!isAiNode) continue;

        const outgoing = helpers.getOutgoingConnections(node.name);
        for (const conn of outgoing) {
          const target = helpers.getNodeByName(conn.node);
          if (!target || target.disabled) continue;

          // If AI output goes directly to external calls, DB writes, or emails
          const isDangerous =
            target.type.toLowerCase().includes("httprequest") ||
            target.type.toLowerCase().includes("postgres") ||
            target.type.toLowerCase().includes("mysql") ||
            target.type.toLowerCase().includes("mongodb") ||
            target.type.toLowerCase().includes("email") ||
            target.type.toLowerCase().includes("gmail") ||
            target.type.toLowerCase().includes("slack") ||
            target.type.toLowerCase().includes("executecommand");

          if (isDangerous) {
            findings.push({
              id: `AI-002-${node.id}-${target.id}`,
              ruleId: "AI-002",
              category: "ai-security" as const,
              severity: "warning" as const,
              title: "AI Output Used Without Validation",
              description: `"${node.name}" output goes directly to "${target.name}" (${target.type}) without validation. AI-generated content could cause unintended actions.`,
              recommendation: `Add a validation/filter node between "${node.name}" and "${target.name}" to check AI output before execution.`,
              affectedNodes: [node.name, target.name],
              affectedNodeIds: [node.id, target.id],
            });
          }
        }
      }
      return findings;
    },
  },
  {
    id: "AI-003",
    category: "ai-security",
    severity: "critical",
    title: "Sensitive Data Sent to AI APIs",
    description:
      "Workflows may be sending PII or sensitive business data to external AI/LLM APIs without data masking.",
    recommendation:
      "Mask or redact sensitive data before sending it to AI APIs. Consider using on-premise AI models for sensitive data.",
    check(workflow, helpers) {
      const findings = [];
      const sensitiveSourceTypes = [
        "postgres",
        "mysql",
        "mongodb",
        "microsoftSql",
        "crm",
        "hubspot",
        "salesforce",
        "airtable",
        "googleSheets",
      ];

      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isAiNode = AI_NODE_TYPES.some((t) =>
          node.type.toLowerCase().includes(t)
        );
        if (!isAiNode) continue;

        // Check if any database/CRM node feeds into this AI node (directly or within 2 hops)
        const incoming = helpers.getIncomingConnections(node.name);
        for (const { fromNode } of incoming) {
          const source = helpers.getNodeByName(fromNode);
          if (!source) continue;

          const isSensitiveSource = sensitiveSourceTypes.some((t) =>
            source.type.toLowerCase().includes(t.toLowerCase())
          );

          if (isSensitiveSource) {
            findings.push({
              id: `AI-003-${source.id}-${node.id}`,
              ruleId: "AI-003",
              category: "ai-security" as const,
              severity: "critical" as const,
              title: "Sensitive Data Sent to AI API",
              description: `Data from "${source.name}" (${source.type}) flows directly to AI node "${node.name}". Database/CRM data may contain PII.`,
              recommendation: `Add a data masking step between "${source.name}" and "${node.name}" to redact PII before sending to the AI API.`,
              affectedNodes: [source.name, node.name],
              affectedNodeIds: [source.id, node.id],
            });
          }

          // Also check 2nd hop
          const secondHop = helpers.getIncomingConnections(fromNode);
          for (const { fromNode: secondSource } of secondHop) {
            const src2 = helpers.getNodeByName(secondSource);
            if (!src2) continue;
            const isSensitive2 = sensitiveSourceTypes.some((t) =>
              src2.type.toLowerCase().includes(t.toLowerCase())
            );
            if (isSensitive2) {
              findings.push({
                id: `AI-003-${src2.id}-${node.id}`,
                ruleId: "AI-003",
                category: "ai-security" as const,
                severity: "critical" as const,
                title: "Sensitive Data Sent to AI API",
                description: `Data from "${src2.name}" flows through "${source?.name}" to AI node "${node.name}". Database/CRM data may contain PII.`,
                recommendation: `Add a data masking step before "${node.name}" to redact sensitive fields from "${src2.name}".`,
                affectedNodes: [src2.name, node.name],
                affectedNodeIds: [src2.id, node.id],
              });
            }
          }
        }
      }
      return findings;
    },
  },
  {
    id: "AI-004",
    category: "ai-security",
    severity: "warning",
    title: "No Rate Limiting on AI API Calls",
    description:
      "AI/LLM nodes triggered by webhooks or loops without rate limiting could cause excessive API costs.",
    recommendation:
      "Add rate limiting, throttling, or batch processing before AI API calls to control costs.",
    check(workflow, helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isAiNode = AI_NODE_TYPES.some((t) =>
          node.type.toLowerCase().includes(t)
        );
        if (!isAiNode) continue;

        // Check if triggered by webhook or loop
        const triggers = helpers.getTriggerNodes();
        const hasWebhookTrigger = triggers.some(
          (t) =>
            t.type.toLowerCase().includes("webhook") && !t.disabled
        );

        // Check if there's a SplitInBatches or Wait node before the AI node
        const hasBatchOrThrottle = workflow.nodes.some(
          (n) =>
            !n.disabled &&
            (n.type.toLowerCase().includes("splitinbatches") ||
              n.type.toLowerCase().includes("wait"))
        );

        if (hasWebhookTrigger && !hasBatchOrThrottle) {
          findings.push({
            id: `AI-004-${node.id}`,
            ruleId: "AI-004",
            category: "ai-security" as const,
            severity: "warning" as const,
            title: "No Rate Limiting on AI API Calls",
            description: `"${node.name}" is triggered by a webhook without rate limiting. Excessive requests could cause high API costs.`,
            recommendation: `Add a Wait, SplitInBatches, or rate-limiting node before "${node.name}" to control API usage.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "AI-005",
    category: "ai-security",
    severity: "warning",
    title: "No Human-in-the-Loop for AI Decisions",
    description:
      "AI-driven actions that affect external systems have no human approval step.",
    recommendation:
      "Add a manual approval or review step (e.g., Wait for Webhook, Slack approval) before AI-driven actions reach production systems.",
    check(workflow, helpers) {
      const findings = [];
      const criticalActions = [
        "httprequest",
        "postgres",
        "mysql",
        "mongodb",
        "email",
        "gmail",
        "slack",
        "sendgrid",
        "stripe",
        "executecommand",
      ];

      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isAiNode = AI_NODE_TYPES.some((t) =>
          node.type.toLowerCase().includes(t)
        );
        if (!isAiNode) continue;

        // Trace forward from AI node to find critical actions
        const visited = new Set<string>();
        const queue = [node.name];
        const criticalTargets: string[] = [];

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (visited.has(current)) continue;
          visited.add(current);

          const outgoing = helpers.getOutgoingConnections(current);
          for (const conn of outgoing) {
            const target = helpers.getNodeByName(conn.node);
            if (!target || target.disabled) continue;

            const isCritical = criticalActions.some((t) =>
              target.type.toLowerCase().includes(t)
            );
            const isApproval =
              target.type.toLowerCase().includes("wait") ||
              target.type.toLowerCase().includes("form") ||
              target.type.toLowerCase().includes("manual");

            if (isApproval) {
              // Found a human-in-the-loop, stop tracing this path
              continue;
            }

            if (isCritical) {
              criticalTargets.push(target.name);
            }
            queue.push(conn.node);
          }
        }

        if (criticalTargets.length > 0) {
          findings.push({
            id: `AI-005-${node.id}`,
            ruleId: "AI-005",
            category: "ai-security" as const,
            severity: "warning" as const,
            title: "No Human-in-the-Loop for AI Decisions",
            description: `AI node "${node.name}" drives actions on ${criticalTargets.map((n) => `"${n}"`).join(", ")} without a human approval step.`,
            recommendation: `Add a Wait for Webhook or manual approval node between "${node.name}" and critical action nodes.`,
            affectedNodes: [node.name, ...criticalTargets],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "AI-006",
    category: "ai-security",
    severity: "info",
    title: "AI Model Configuration Not Specified",
    description:
      "AI/LLM nodes without explicit model, temperature, or max_tokens configuration may produce inconsistent or costly results.",
    recommendation:
      "Explicitly set model version, temperature, and max_tokens parameters for predictable and cost-controlled AI behavior.",
    check(workflow, helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isAiNode = AI_NODE_TYPES.some((t) =>
          node.type.toLowerCase().includes(t)
        );
        if (!isAiNode) continue;

        const params = helpers.stringifyParameters(node).toLowerCase();
        const hasModel =
          params.includes("model") || params.includes("modelid");
        const hasTemp = params.includes("temperature");
        const hasMaxTokens =
          params.includes("maxtokens") ||
          params.includes("max_tokens") ||
          params.includes("maxoutputtokens");

        const missing: string[] = [];
        if (!hasModel) missing.push("model");
        if (!hasTemp) missing.push("temperature");
        if (!hasMaxTokens) missing.push("max_tokens");

        if (missing.length > 0) {
          findings.push({
            id: `AI-006-${node.id}`,
            ruleId: "AI-006",
            category: "ai-security" as const,
            severity: "info" as const,
            title: "AI Model Configuration Not Specified",
            description: `"${node.name}" is missing explicit configuration for: ${missing.join(", ")}.`,
            recommendation: `Set ${missing.join(", ")} on "${node.name}" for predictable behavior and cost control.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
];
