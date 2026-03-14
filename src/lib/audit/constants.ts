import type { AuditCategory, Severity } from "@/types/audit";

export const CATEGORY_WEIGHTS: Record<AuditCategory, number> = {
  security: 0.18,
  "error-handling": 0.15,
  "ai-security": 0.15,
  "data-privacy": 0.13,
  compliance: 0.1,
  "vendor-risk": 0.1,
  performance: 0.1,
  "best-practices": 0.09,
};

export const SEVERITY_DEDUCTIONS: Record<Severity, number> = {
  critical: 25,
  warning: 10,
  info: 3,
};

// Static fallback labels (used in non-component contexts like exports)
export const CATEGORY_LABELS: Record<AuditCategory, string> = {
  "error-handling": "Error Handling",
  security: "Security",
  performance: "Performance",
  "best-practices": "Best Practices",
  "ai-security": "AI Security",
  "data-privacy": "Data Privacy",
  compliance: "Compliance",
  "vendor-risk": "Vendor Risk",
};

// Translation keys for category labels and descriptions
export const CATEGORY_LABEL_KEYS: Record<AuditCategory, string> = {
  "error-handling": "category.error-handling",
  security: "category.security",
  performance: "category.performance",
  "best-practices": "category.best-practices",
  "ai-security": "category.ai-security",
  "data-privacy": "category.data-privacy",
  compliance: "category.compliance",
  "vendor-risk": "category.vendor-risk",
};

export const CATEGORY_DESC_KEYS: Record<AuditCategory, string> = {
  "error-handling": "category.error-handling.desc",
  security: "category.security.desc",
  performance: "category.performance.desc",
  "best-practices": "category.best-practices.desc",
  "ai-security": "category.ai-security.desc",
  "data-privacy": "category.data-privacy.desc",
  compliance: "category.compliance.desc",
  "vendor-risk": "category.vendor-risk.desc",
};

// Node types that typically make external calls
export const EXTERNAL_CALL_TYPES = [
  "httpRequest",
  "http",
  "webhook",
  "postgres",
  "mysql",
  "mongodb",
  "redis",
  "graphql",
  "ftp",
  "ssh",
  "smtp",
  "imap",
  "slack",
  "telegram",
  "discord",
  "gmail",
  "googleSheets",
  "airtable",
  "notion",
  "stripe",
  "twilio",
  "sendGrid",
  "mailchimp",
  "hubspot",
  "salesforce",
  "jira",
  "github",
  "gitlab",
  "aws",
  "azureDevOps",
];

// Node types that are notification channels
export const NOTIFICATION_TYPES = [
  "slack",
  "telegram",
  "discord",
  "gmail",
  "email",
  "smtp",
  "sendGrid",
  "twilio",
  "microsoftTeams",
  "pushover",
  "pushbullet",
  "mattermost",
];

// Default node names that indicate the user hasn't renamed them
export const DEFAULT_NODE_NAMES = [
  "HTTP Request",
  "IF",
  "Code",
  "Set",
  "Function",
  "Switch",
  "Merge",
  "Split In Batches",
  "Wait",
  "No Operation",
  "NoOp",
  "Move Binary Data",
  "Webhook",
  "Cron",
  "Start",
  "Execute Workflow",
  "Error Trigger",
  "Item Lists",
  "Date & Time",
  "Crypto",
  "XML",
  "HTML",
  "Markdown",
  "RSS Feed Read",
  "Execute Command",
  "Read Binary File",
  "Write Binary File",
  "Spreadsheet File",
  "Compression",
];
