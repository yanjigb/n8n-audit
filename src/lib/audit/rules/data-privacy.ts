import type { AuditRule } from "@/types/audit";

// PII-related keywords in parameters
const PII_KEYWORDS = [
  "email",
  "phone",
  "address",
  "ssn",
  "social_security",
  "passport",
  "credit_card",
  "creditcard",
  "card_number",
  "date_of_birth",
  "dob",
  "national_id",
  "tax_id",
  "driver_license",
  "firstname",
  "first_name",
  "lastname",
  "last_name",
  "fullname",
  "full_name",
  "salary",
  "bank_account",
  "iban",
  "swift",
];

export const dataPrivacyRules: AuditRule[] = [
  {
    id: "PRIV-001",
    category: "data-privacy",
    severity: "warning",
    title: "PII Fields in Workflow Parameters",
    description:
      "Node parameters reference fields that commonly contain Personally Identifiable Information (PII).",
    recommendation:
      "Ensure PII fields are handled in compliance with GDPR/CCPA. Consider masking, encrypting, or minimizing PII data in workflows.",
    check(workflow, helpers) {
      const findings = [];
      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const params = helpers.stringifyParameters(node).toLowerCase();
        const foundPii = PII_KEYWORDS.filter((k) => params.includes(k));

        if (foundPii.length > 0) {
          findings.push({
            id: `PRIV-001-${node.id}`,
            ruleId: "PRIV-001",
            category: "data-privacy" as const,
            severity: "warning" as const,
            title: "PII Fields in Workflow Parameters",
            description: `"${node.name}" references PII-related fields: ${foundPii.join(", ")}. Ensure proper handling under privacy regulations.`,
            recommendation: `Review PII handling in "${node.name}". Consider data masking, encryption, or using only necessary fields.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "PRIV-002",
    category: "data-privacy",
    severity: "warning",
    title: "Data Sent to Multiple External Services",
    description:
      "Workflow sends data to many different third-party services, increasing the data exposure surface.",
    recommendation:
      "Minimize the number of external services that receive sensitive data. Document data flows for privacy compliance.",
    check(workflow, helpers) {
      const externalServices = new Set<string>();
      const serviceTypes = [
        "httprequest",
        "slack",
        "gmail",
        "googlesheets",
        "airtable",
        "notion",
        "hubspot",
        "salesforce",
        "stripe",
        "twilio",
        "sendgrid",
        "mailchimp",
        "telegram",
        "discord",
        "dropbox",
        "googledrive",
        "onedrive",
        "aws",
        "azure",
      ];

      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        for (const svc of serviceTypes) {
          if (node.type.toLowerCase().includes(svc)) {
            externalServices.add(node.type);
          }
        }
      }

      if (externalServices.size > 5) {
        return [
          {
            id: "PRIV-002-1",
            ruleId: "PRIV-002",
            category: "data-privacy" as const,
            severity: "warning" as const,
            title: "Data Sent to Multiple External Services",
            description: `Workflow connects to ${externalServices.size} different external service types. Large data exposure surface.`,
            recommendation:
              "Document all data flows. Ensure each service only receives the minimum data necessary. Consider a data flow diagram.",
            metadata: {
              serviceCount: externalServices.size,
              services: Array.from(externalServices),
            },
          },
        ];
      }
      return [];
    },
  },
  {
    id: "PRIV-003",
    category: "data-privacy",
    severity: "info",
    title: "No Data Cleanup or Retention Logic",
    description:
      "Workflow processes data but has no visible data deletion, cleanup, or retention management nodes.",
    recommendation:
      "Add data cleanup steps or configure data retention policies to comply with privacy regulations.",
    check(workflow) {
      const hasCleanup = workflow.nodes.some((n) => {
        const type = n.type.toLowerCase();
        const params = JSON.stringify(n.parameters).toLowerCase();
        return (
          type.includes("delete") ||
          params.includes("delete") ||
          params.includes("remove") ||
          params.includes("purge") ||
          params.includes("cleanup") ||
          params.includes("retention")
        );
      });

      const hasDataNodes = workflow.nodes.some((n) => {
        const type = n.type.toLowerCase();
        return (
          type.includes("postgres") ||
          type.includes("mysql") ||
          type.includes("mongodb") ||
          type.includes("airtable") ||
          type.includes("googlesheets")
        );
      });

      if (hasDataNodes && !hasCleanup) {
        return [
          {
            id: "PRIV-003-1",
            ruleId: "PRIV-003",
            category: "data-privacy" as const,
            severity: "info" as const,
            title: "No Data Cleanup or Retention Logic",
            description:
              "Workflow reads/writes data but has no visible cleanup or retention management. Data may accumulate without limits.",
            recommendation:
              "Add data retention policies or cleanup steps. Consider scheduling periodic data purge workflows.",
          },
        ];
      }
      return [];
    },
  },
  {
    id: "PRIV-004",
    category: "data-privacy",
    severity: "warning",
    title: "Bulk Data Retrieval Without Filtering",
    description:
      "Database or API nodes retrieve all records without field filtering, potentially exposing unnecessary sensitive data.",
    recommendation:
      "Use SELECT specific columns instead of SELECT *, and add WHERE clauses to limit data retrieval to only what's needed.",
    check(workflow, helpers) {
      const findings = [];
      const dbTypes = ["postgres", "mysql", "mongodb", "microsoftsql"];

      for (const node of workflow.nodes) {
        if (node.disabled) continue;
        const isDb = dbTypes.some((t) =>
          node.type.toLowerCase().includes(t)
        );
        if (!isDb) continue;

        const params = helpers.stringifyParameters(node).toLowerCase();
        const hasSelectAll =
          params.includes("select *") || params.includes("getall");
        const hasFieldFilter =
          params.includes("fields") ||
          params.includes("columns") ||
          params.includes("projection");

        if (hasSelectAll && !hasFieldFilter) {
          findings.push({
            id: `PRIV-004-${node.id}`,
            ruleId: "PRIV-004",
            category: "data-privacy" as const,
            severity: "warning" as const,
            title: "Bulk Data Retrieval Without Filtering",
            description: `"${node.name}" retrieves all fields/records without column filtering. May expose unnecessary sensitive data.`,
            recommendation: `Specify only the required fields in "${node.name}" instead of retrieving all columns.`,
            affectedNodes: [node.name],
            affectedNodeIds: [node.id],
          });
        }
      }
      return findings;
    },
  },
  {
    id: "PRIV-005",
    category: "data-privacy",
    severity: "info",
    title: "Data Logging Without Privacy Controls",
    description:
      "Workflow saves execution data without explicit controls for sensitive data in execution logs.",
    recommendation:
      "Configure saveDataErrorExecution and saveDataSuccessExecution settings. Avoid logging sensitive data in execution history.",
    check(workflow) {
      const settings = workflow.settings;
      if (!settings) {
        return [
          {
            id: "PRIV-005-1",
            ruleId: "PRIV-005",
            category: "data-privacy" as const,
            severity: "info" as const,
            title: "Data Logging Without Privacy Controls",
            description:
              "No workflow settings configured. Default execution logging may store sensitive data in execution history.",
            recommendation:
              "Configure workflow settings: set saveDataSuccessExecution and saveDataErrorExecution to control what data is logged.",
          },
        ];
      }

      if (
        !settings.saveDataErrorExecution ||
        !settings.saveDataSuccessExecution
      ) {
        return [
          {
            id: "PRIV-005-2",
            ruleId: "PRIV-005",
            category: "data-privacy" as const,
            severity: "info" as const,
            title: "Data Logging Without Privacy Controls",
            description:
              "Execution data save settings are not explicitly configured. Sensitive data may be stored in execution logs.",
            recommendation:
              "Set saveDataSuccessExecution and saveDataErrorExecution in workflow settings to control data retention.",
          },
        ];
      }
      return [];
    },
  },
];
