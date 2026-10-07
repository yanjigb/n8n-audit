import type { AuditRule } from "@/types/audit";
import { EXTERNAL_CALL_TYPES } from "../constants";

export const vendorRiskRules: AuditRule[] = [
  {
    id: "VENDOR-001",
    category: "vendor-risk",
    severity: "warning",
    title: "High Third-Party Service Dependency",
    description:
      "Workflow depends on many different third-party services, increasing vendor risk exposure.",
    recommendation:
      "Document all vendor dependencies. Ensure each vendor has been security-assessed and has appropriate SLAs.",
    check(workflow) {
      const vendorTypes = new Set<string>();
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        for (const ext of EXTERNAL_CALL_TYPES) {
          if (node.type.toLowerCase().includes(ext.toLowerCase())) {
            vendorTypes.add(ext);
          }
        }
      }

      if (vendorTypes.size > 4) {
        return [
          {
            id: "VENDOR-001-1",
            ruleId: "VENDOR-001",
            category: "vendor-risk" as const,
            severity: "warning" as const,
            title: "High Third-Party Service Dependency",
            description: `Workflow depends on ${vendorTypes.size} different external service types: ${Array.from(vendorTypes).join(", ")}.`,
            recommendation:
              "Conduct a vendor risk assessment for each service. Ensure SLAs, security certifications (SOC 2), and incident response plans are in place.",
            metadata: {
              vendorCount: vendorTypes.size,
              vendors: Array.from(vendorTypes),
            },
          },
        ];
      }
      return [];
    },
  },
  {
    id: "VENDOR-002",
    category: "vendor-risk",
    severity: "warning",
    title: "Unverified External Endpoints",
    description:
      "HTTP Request nodes call external URLs that are not standard well-known API endpoints.",
    recommendation:
      "Verify all external URLs are legitimate and belong to trusted vendors. Use allowlists for permitted domains.",
    check(workflow, helpers) {
      const findings = [];
      const httpNodes = helpers.getNodesByType("httpRequest");

      for (const node of httpNodes) {
        if (node.disabled) continue;
        const allValues = helpers.getAllParameterValues(node);

        for (const val of allValues) {
          if (
            (val.startsWith("http://") || val.startsWith("https://")) &&
            !val.startsWith("http://localhost") &&
            !val.startsWith("http://127.0.0.1") &&
            !val.startsWith("https://localhost")
          ) {
            // Check for common well-known domains
            const knownDomains = [
              "api.openai.com",
              "api.anthropic.com",
              "api.stripe.com",
              "api.github.com",
              "api.slack.com",
              "graph.microsoft.com",
              "googleapis.com",
              "api.hubspot.com",
              "api.salesforce.com",
              "api.notion.com",
              "api.airtable.com",
              "api.twilio.com",
              "api.sendgrid.com",
            ];

            const isKnown = knownDomains.some((d) => val.includes(d));
            const isExpression = val.includes("{{");

            if (!isKnown && !isExpression) {
              findings.push({
                id: `VENDOR-002-${node.id}`,
                ruleId: "VENDOR-002",
                category: "vendor-risk" as const,
                severity: "warning" as const,
                title: "Unverified External Endpoint",
                description: `"${node.name}" calls "${val.substring(0, 80)}..." which is not a commonly recognized API endpoint.`,
                recommendation: `Verify that "${val.substring(0, 50)}" is a trusted endpoint. Add it to your organization's domain allowlist.`,
                affectedNodes: [node.name],
                affectedNodeIds: [node.id],
              });
              break;
            }
          }
        }
      }
      return findings;
    },
  },
  {
    id: "VENDOR-003",
    category: "vendor-risk",
    severity: "info",
    title: "Single Point of Failure - External Service",
    description:
      "Critical workflow paths depend on a single external service without a fallback.",
    recommendation:
      "Add fallback paths or retry mechanisms for critical external service dependencies.",
    check(workflow, helpers) {
      const findings = [];

      // Find nodes that are the only path between trigger and a terminal action
      const httpNodes = workflow.nodes.filter(
        (n) =>
          n.type.toLowerCase().includes("httprequest") && !n.disabled
      );

      for (const httpNode of httpNodes) {
        const outgoing = helpers.getOutgoingConnections(httpNode.name);
        const incoming = helpers.getIncomingConnections(httpNode.name);

        // If this HTTP node has only one incoming and multiple downstream nodes depend on it
        if (incoming.length <= 1 && outgoing.length > 0) {
          const hasRetry = httpNode.retryOnFail;
          const hasFallback = outgoing.length > 1; // Multiple outputs suggest error handling
          const hasOnError =
            httpNode.onError === "continueErrorOutput" ||
            httpNode.onError === "continueRegularOutput";

          if (!hasRetry && !hasFallback && !hasOnError) {
            findings.push({
              id: `VENDOR-003-${httpNode.id}`,
              ruleId: "VENDOR-003",
              category: "vendor-risk" as const,
              severity: "info" as const,
              title: "Single Point of Failure - External Service",
              description: `"${httpNode.name}" is a single point of failure. If this external service is down, the workflow stops.`,
              recommendation: `Add retry configuration, error handling, or a fallback path for "${httpNode.name}".`,
              affectedNodes: [httpNode.name],
              affectedNodeIds: [httpNode.id],
            });
          }
        }
      }
      return findings;
    },
  },
  {
    id: "VENDOR-004",
    category: "vendor-risk",
    severity: "info",
    title: "No Vendor Health Monitoring",
    description:
      "Workflow has no health check or monitoring for external service availability.",
    recommendation:
      "Create a separate health check workflow that monitors the availability of critical external services.",
    check(workflow, _helpers) {
      const externalNodes = workflow.nodes.filter((n) => {
        if (n.disabled) return false;
        return EXTERNAL_CALL_TYPES.some((t) =>
          n.type.toLowerCase().includes(t.toLowerCase())
        );
      });

      if (externalNodes.length < 3) return [];

      // Check if workflow name or nodes suggest monitoring
      const hasMonitoring = workflow.nodes.some((n) => {
        const name = n.name.toLowerCase();
        return (
          name.includes("health") ||
          name.includes("monitor") ||
          name.includes("ping") ||
          name.includes("status check")
        );
      });

      if (!hasMonitoring) {
        return [
          {
            id: "VENDOR-004-1",
            ruleId: "VENDOR-004",
            category: "vendor-risk" as const,
            severity: "info" as const,
            title: "No Vendor Health Monitoring",
            description: `Workflow uses ${externalNodes.length} external services but has no health monitoring. Service outages may go undetected.`,
            recommendation:
              "Create a health check workflow that periodically pings critical external services and alerts on failures.",
            metadata: { externalNodeCount: externalNodes.length },
          },
        ];
      }
      return [];
    },
  },
  {
    id: "VENDOR-005",
    category: "vendor-risk",
    severity: "warning",
    title: "Shared Credentials Across Nodes",
    description:
      "Multiple nodes use the same credential, creating a wider blast radius if the credential is compromised.",
    recommendation:
      "Use separate credentials per service where possible. Implement credential rotation and monitor for unauthorized usage.",
    check(workflow) {
      const findings = [];
      const credUsage = new Map<string, string[]>();

      for (const node of workflow.nodes) {
        if (node.disabled || !node.credentials) continue;
        for (const [, cred] of Object.entries(node.credentials)) {
          const key = cred.name || cred.id || "";
          if (!key) continue;
          const users = credUsage.get(key) ?? [];
          users.push(node.name);
          credUsage.set(key, users);
        }
      }

      for (const [credName, users] of credUsage) {
        if (users.length > 3) {
          findings.push({
            id: `VENDOR-005-${credName}`,
            ruleId: "VENDOR-005",
            category: "vendor-risk" as const,
            severity: "warning" as const,
            title: "Shared Credentials Across Nodes",
            description: `Credential "${credName}" is used by ${users.length} nodes: ${users.map((u) => `"${u}"`).join(", ")}. Wide blast radius if compromised.`,
            recommendation: `Review if all ${users.length} nodes need the same credential. Consider separate credentials with least-privilege scopes.`,
            affectedNodes: users,
          });
        }
      }
      return findings;
    },
  },
];
