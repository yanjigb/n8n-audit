import type { AuditRule } from "@/types/audit";

const API_KEY_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
  /AIza[a-zA-Z0-9_-]{35}/,
  /ghp_[a-zA-Z0-9]{36}/,
  /gho_[a-zA-Z0-9]{36}/,
  /glpat-[a-zA-Z0-9_-]{20,}/,
  /xox[baprs]-[a-zA-Z0-9-]+/,
  /Bearer\s+[a-zA-Z0-9_\-.]{20,}/,
  /Basic\s+[a-zA-Z0-9+/=]{20,}/,
  /AKIA[A-Z0-9]{16}/,
];

const SENSITIVE_PARAM_KEYS = [
  "password",
  "apiKey",
  "api_key",
  "apikey",
  "token",
  "secret",
  "secretKey",
  "secret_key",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "privateKey",
  "private_key",
  "clientSecret",
  "client_secret",
  "authorization",
];

function findSensitiveValues(
  obj: unknown,
  path: string[] = []
): Array<{ path: string; value: string }> {
  const results: Array<{ path: string; value: string }> = [];
  if (typeof obj === "string" && obj.length > 0) {
    const currentKey = path[path.length - 1]?.toLowerCase() ?? "";
    const isSensitiveKey = SENSITIVE_PARAM_KEYS.some((k) =>
      currentKey.includes(k.toLowerCase())
    );
    // Only flag literal values, not expressions like {{$node...}} or ={{...}}
    const isExpression = obj.startsWith("={{") || obj.startsWith("{{");
    if (isSensitiveKey && !isExpression && obj.length > 3) {
      results.push({ path: path.join("."), value: obj });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) =>
      results.push(...findSensitiveValues(item, [...path, String(i)]))
    );
  } else if (obj && typeof obj === "object") {
    for (const [key, val] of Object.entries(obj)) {
      results.push(...findSensitiveValues(val, [...path, key]));
    }
  }
  return results;
}

export const securityRules: AuditRule[] = [
  {
    id: "SEC-001",
    category: "security",
    severity: "critical",
    title: "Hardcoded Credentials",
    description:
      "Sensitive values (passwords, API keys, tokens) are hardcoded in node parameters instead of using n8n credentials.",
    recommendation:
      "Move sensitive values to n8n Credentials and reference them from the node.",
    check(workflow) {
      const findings = [];
      for (const node of workflow.nodes) {
        const sensitive = findSensitiveValues(node.parameters);
        for (const { path, value } of sensitive) {
          findings.push({
            id: `SEC-001-${node.id}-${path}`,
            ruleId: "SEC-001",
            category: "security" as const,
            severity: "critical" as const,
            title: "Hardcoded Credentials",
            description: `"${node.name}" has a hardcoded sensitive value at parameters.${path} (value: ${value.substring(0, 4)}***).`,
            recommendation: `Move the value at "${path}" in "${node.name}" to an n8n credential.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "SEC-002",
    category: "security",
    severity: "warning",
    title: "Insecure HTTP Calls",
    description:
      "HTTP Request nodes using http:// instead of https:// send data unencrypted.",
    recommendation:
      "Switch all HTTP URLs to HTTPS for encrypted communication.",
    check(workflow, helpers) {
      const findings = [];
      const httpNodes = helpers.getNodesByType("httpRequest");
      for (const node of httpNodes) {
        if (node.disabled) continue;
        const allValues = helpers.getAllParameterValues(node);
        for (const val of allValues) {
          if (
            val.startsWith("http://") &&
            !val.startsWith("http://localhost") &&
            !val.startsWith("http://127.0.0.1")
          ) {
            findings.push({
              id: `SEC-002-${node.id}`,
              ruleId: "SEC-002",
              category: "security" as const,
              severity: "warning" as const,
              title: "Insecure HTTP Call",
              description: `"${node.name}" uses insecure HTTP: ${val.substring(0, 50)}...`,
              recommendation: `Change the URL in "${node.name}" from http:// to https://.`,
              affectedNodes: [node.name],
              affectedNodeIds: [node.id],
            });
            break;
          }
        }
      }
      return findings;
    },
  },
  {
    id: "SEC-003",
    category: "security",
    severity: "critical",
    title: "Exposed API Keys in Expressions",
    description:
      "API key patterns detected in node parameters that may be exposed.",
    recommendation:
      "Remove API keys from expressions and use n8n Credentials instead.",
    check(workflow, helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        const paramStr = helpers.stringifyParameters(node);
        for (const pattern of API_KEY_PATTERNS) {
          const match = paramStr.match(pattern);
          if (match) {
            findings.push({
              id: `SEC-003-${node.id}`,
              ruleId: "SEC-003",
              category: "security" as const,
              severity: "critical" as const,
              title: "Exposed API Key in Expressions",
              description: `"${node.name}" contains what appears to be an API key: ${match[0].substring(0, 8)}***`,
              recommendation: `Remove the API key from "${node.name}" parameters and use n8n Credentials.`,
              affectedNodes: [node.name],
              affectedNodeIds: [node.id],
            });
            break;
          }
        }
      }
      return findings;
    },
  },
  {
    id: "SEC-004",
    category: "security",
    severity: "warning",
    title: "Missing Credential References",
    description:
      "Nodes that typically require authentication have no credentials configured.",
    recommendation:
      "Add appropriate credentials to the node via n8n Credentials.",
    check(workflow, helpers) {
      const findings = [];
      const httpNodes = helpers.getNodesByType("httpRequest");
      for (const node of httpNodes) {
        if (node.disabled) continue;
        const hasAuth =
          node.credentials &&
          Object.keys(node.credentials).length > 0;
        const params = node.parameters as Record<string, unknown>;
        const authType = params.authentication ?? params.auth;
        if (!hasAuth && !authType) {
          // Check if URL suggests authentication is needed
          const allValues = helpers.getAllParameterValues(node);
          const hasApiPath = allValues.some(
            (v) =>
              v.includes("/api/") ||
              v.includes("api.") ||
              v.includes("oauth")
          );
          if (hasApiPath) {
            findings.push({
              id: `SEC-004-${node.id}`,
              ruleId: "SEC-004",
              category: "security" as const,
              severity: "warning" as const,
              title: "Missing Credential References",
              description: `"${node.name}" calls an API endpoint but has no credentials configured.`,
              recommendation: `Add appropriate authentication credentials to "${node.name}".`,
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
    id: "SEC-005",
    category: "security",
    severity: "warning",
    title: "Webhook Without Authentication",
    description:
      "Webhook trigger nodes without authentication allow anyone to trigger the workflow.",
    recommendation:
      "Add authentication (Header Auth, Basic Auth, or JWT) to the webhook.",
    check(workflow, helpers) {
      const findings = [];
      const webhooks = helpers.getNodesByType("webhook");
      for (const node of webhooks) {
        if (node.disabled) continue;
        const params = node.parameters as Record<string, unknown>;
        const auth = params.authentication;
        if (!auth || auth === "none") {
          findings.push({
            id: `SEC-005-${node.id}`,
            ruleId: "SEC-005",
            category: "security" as const,
            severity: "warning" as const,
            title: "Webhook Without Authentication",
            description: `"${node.name}" webhook has no authentication. Anyone with the URL can trigger it.`,
            recommendation: `Add Header Auth, Basic Auth, or JWT authentication to "${node.name}".`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "SEC-006",
    category: "security",
    severity: "critical",
    title: "Execute Command Node Present",
    description:
      "Execute Command nodes can run arbitrary shell commands on the server, posing a severe security risk.",
    recommendation:
      "Remove Execute Command nodes or restrict them with strict input validation. Consider using Code nodes instead.",
    check(workflow, helpers) {
      const findings = [];
      const cmdNodes = helpers.getNodesByType("executeCommand");
      for (const node of cmdNodes) {
        if (node.disabled) continue;
        const params = helpers.stringifyParameters(node);
        const hasDynamicInput =
          params.includes("{{") || params.includes("$json");
        findings.push({
          id: `SEC-006-${node.id}`,
          ruleId: "SEC-006",
          category: "security" as const,
          severity: "critical" as const,
          title: "Execute Command Node Present",
          description: `"${node.name}" can execute shell commands on the server.${hasDynamicInput ? " Uses dynamic input — HIGH command injection risk." : ""}`,
          recommendation: `Remove "${node.name}" or replace with a Code node. If required, add strict input validation and allowlisting.`,
          affectedNodes: [node.name],
          affectedNodeIds: [node.id],
        });
      }
      return findings;
    },
  },
  {
    id: "SEC-007",
    category: "security",
    severity: "warning",
    title: "Code Node with Dangerous Patterns",
    description:
      "Code/Function nodes contain dangerous patterns like eval(), Function constructor, or child_process.",
    recommendation:
      "Remove eval() and dynamic code execution patterns. Use safe parsing alternatives.",
    check(workflow, helpers) {
      const findings = [];
      const codeNodes = workflow.nodes.filter(
        (n) =>
          !n.disabled &&
          (n.type.toLowerCase().includes("code") ||
            n.type.toLowerCase().includes("function"))
      );

      for (const node of codeNodes) {
        const params = helpers.stringifyParameters(node);
        const hasEval =
          params.includes("eval(") ||
          params.includes("Function(") ||
          params.includes("new Function") ||
          params.includes("exec(") ||
          params.includes("child_process");

        if (hasEval) {
          findings.push({
            id: `SEC-007-${node.id}`,
            ruleId: "SEC-007",
            category: "security" as const,
            severity: "warning" as const,
            title: "Code Node with Dangerous Patterns",
            description: `"${node.name}" contains dangerous code patterns (eval, Function constructor, or child_process). Potential code injection risk.`,
            recommendation: `Remove eval/Function/exec patterns from "${node.name}". Use safe parsing alternatives.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "SEC-008",
    category: "security",
    severity: "warning",
    title: "Webhook Accepts All HTTP Methods",
    description:
      "Webhook nodes accepting all HTTP methods have a larger attack surface than necessary.",
    recommendation:
      "Restrict webhook to only the required HTTP method (e.g., POST only).",
    check(workflow, helpers) {
      const findings = [];
      const webhooks = helpers.getNodesByType("webhook");
      for (const node of webhooks) {
        if (node.disabled) continue;
        const params = node.parameters as Record<string, unknown>;
        const method = params.httpMethod;
        if (!method || method === "*" || method === "ALL") {
          findings.push({
            id: `SEC-008-${node.id}`,
            ruleId: "SEC-008",
            category: "security" as const,
            severity: "warning" as const,
            title: "Webhook Accepts All HTTP Methods",
            description: `"${node.name}" accepts all HTTP methods. Unnecessary methods increase the attack surface.`,
            recommendation: `Restrict "${node.name}" to only the required HTTP method (typically POST).`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "SEC-009",
    category: "security",
    severity: "critical",
    title: "SSL Verification Disabled",
    description:
      "HTTP Request nodes with SSL verification disabled are vulnerable to man-in-the-middle attacks.",
    recommendation:
      "Enable SSL verification. Only disable it for local development with self-signed certificates.",
    check(workflow, helpers) {
      const findings = [];
      const httpNodes = helpers.getNodesByType("httpRequest");
      for (const node of httpNodes) {
        if (node.disabled) continue;
        const params = node.parameters as Record<string, unknown>;
        const options = params.options as
          | Record<string, unknown>
          | undefined;
        const sslDisabled =
          options?.allowUnauthorizedCerts === true ||
          params.allowUnauthorizedCerts === true ||
          params.rejectUnauthorized === false;

        if (sslDisabled) {
          findings.push({
            id: `SEC-009-${node.id}`,
            ruleId: "SEC-009",
            category: "security" as const,
            severity: "critical" as const,
            title: "SSL Verification Disabled",
            description: `"${node.name}" has SSL certificate verification disabled. Vulnerable to man-in-the-middle attacks.`,
            recommendation: `Enable SSL verification on "${node.name}". Use proper certificates instead of disabling verification.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "SEC-010",
    category: "security",
    severity: "warning",
    title: "Internal Network URLs Exposed",
    description:
      "Nodes reference internal/private network addresses, potentially exposing internal services if the workflow is shared.",
    recommendation:
      "Use environment variables or n8n credentials for internal URLs instead of hardcoded IPs.",
    check(workflow, helpers) {
      const findings = [];
      const internalPatterns = [
        /10\.\d+\.\d+\.\d+/,
        /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/,
        /192\.168\.\d+\.\d+/,
        /\.internal\b/,
        /\.local\b/,
        /\.corp\b/,
        /\.private\b/,
      ];

      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const params = helpers.stringifyParameters(node);
        for (const pattern of internalPatterns) {
          if (pattern.test(params)) {
            findings.push({
              id: `SEC-010-${node.id}`,
              ruleId: "SEC-010",
              category: "security" as const,
              severity: "warning" as const,
              title: "Internal Network URL Exposed",
              description: `"${node.name}" references an internal network address. This may expose internal services if the workflow is shared.`,
              recommendation: `Use environment variables or n8n credentials for internal URLs in "${node.name}" instead of hardcoded IPs.`,
              affectedNodes: [node.name],
              affectedNodeIds: [node.id],
            });
            break;
          }
        }
      }
      return findings;
    },
  },
  {
    id: "SEC-011",
    category: "security",
    severity: "warning",
    title: "Missing Input Validation on Webhook",
    description:
      "Webhook trigger receives external input but no validation or schema check is applied before processing.",
    recommendation:
      "Add an IF or Code node after the webhook to validate input schema, data types, and required fields.",
    check(workflow, helpers) {
      const findings = [];
      const webhooks = helpers.getNodesByType("webhook");

      for (const node of webhooks) {
        if (node.disabled) continue;
        const outgoing = helpers.getOutgoingConnections(node.name);

        const hasValidation = outgoing.some((conn) => {
          const target = helpers.getNodeByName(conn.node);
          if (!target) return false;
          const type = target.type.toLowerCase();
          const name = target.name.toLowerCase();
          return (
            type.includes("if") ||
            type.includes("switch") ||
            type.includes("code") ||
            type.includes("function") ||
            name.includes("valid") ||
            name.includes("check") ||
            name.includes("schema")
          );
        });

        if (!hasValidation) {
          findings.push({
            id: `SEC-011-${node.id}`,
            ruleId: "SEC-011",
            category: "security" as const,
            severity: "warning" as const,
            title: "Missing Input Validation on Webhook",
            description: `"${node.name}" receives external input without a validation step. Malformed or malicious data may propagate.`,
            recommendation: `Add a validation node (IF, Switch, or Code) after "${node.name}" to check input schema and reject invalid data.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
];
