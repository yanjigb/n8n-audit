export const en: Record<string, string> = {
  // Common
  "common.appName": "n8n Audit",
  "common.newAudit": "New Audit",
  "common.toggleTheme": "Toggle theme",
  "common.yes": "Yes",
  "common.no": "No",
  "common.active": "Active",
  "common.inactive": "Inactive",
  "common.configured": "Configured",
  "common.notSet": "Not set",
  "common.nodes": "nodes",
  "common.connections": "connections",

  // Home page
  "home.title": "Audit Your n8n Workflows",
  "home.subtitle":
    "Upload your workflow JSON and let AI analyze it across error handling, performance, security, and best practices.",
  "home.errorHandling": "Error Handling",
  "home.errorHandlingDesc": "Missing handlers & failure paths",
  "home.performance": "Performance",
  "home.performanceDesc": "Bottlenecks & optimizations",
  "home.security": "Security",
  "home.securityDesc": "Credentials & exposed secrets",
  "home.bestPractices": "Best Practices",
  "home.bestPracticesDesc": "Naming, docs & structure",
  "home.aiSecurity": "AI Security",
  "home.aiSecurityDesc": "Prompt injection & AI governance",
  "home.dataPrivacy": "Data Privacy",
  "home.dataPrivacyDesc": "PII handling & data compliance",
  "home.compliance": "Compliance",
  "home.complianceDesc": "Audit trails & regulatory readiness",
  "home.vendorRisk": "Vendor Risk",
  "home.vendorRiskDesc": "Third-party dependencies & SLAs",
  "home.aiPoweredAudit": "AI-Powered Audit",
  "home.analyzing": "AI is analyzing your workflow...",
  "home.runAudit": "Run AI Audit",

  // Sidebar
  "sidebar.dashboard": "Dashboard",
  "sidebar.preview": "Workflow Preview",
  "sidebar.errorHandling": "Error Handling",
  "sidebar.performance": "Performance",
  "sidebar.security": "Security",
  "sidebar.bestPractices": "Best Practices",
  "sidebar.aiSecurity": "AI Security",
  "sidebar.dataPrivacy": "Data Privacy",
  "sidebar.compliance": "Compliance",
  "sidebar.vendorRisk": "Vendor Risk",
  "sidebar.optimize": "AI Optimize",

  // Audit
  "audit.overallScore": "Overall Score",
  "audit.critical": "Critical",
  "audit.warnings": "Warnings",
  "audit.warning": "Warning",
  "audit.info": "Info",
  "audit.all": "All",
  "audit.noIssues": "No issues found in this category.",
  "audit.noIssuesShort": "No issues",
  "audit.recommendation": "Recommendation",
  "audit.affectedNodes": "Affected nodes",
  "audit.dashboard": "Audit Dashboard",
  "audit.dashboardDesc": "Overview of your workflow audit results",
  "audit.categories": "Categories",
  "audit.searchPlaceholder": "Search...",

  // Category labels and descriptions
  "category.error-handling": "Error Handling",
  "category.security": "Security",
  "category.performance": "Performance",
  "category.best-practices": "Best Practices",
  "category.ai-security": "AI Security",
  "category.data-privacy": "Data Privacy",
  "category.compliance": "Compliance",
  "category.vendor-risk": "Vendor Risk",
  "category.error-handling.desc":
    "Checks for proper error handling, failure paths, and recovery mechanisms.",
  "category.security.desc":
    "Identifies hardcoded credentials, insecure connections, and exposed secrets.",
  "category.performance.desc":
    "Detects bottlenecks, unnecessary nodes, and optimization opportunities.",
  "category.best-practices.desc":
    "Evaluates naming conventions, documentation, and workflow structure.",
  "category.ai-security.desc":
    "Audits AI/LLM integrations for prompt injection, data leakage, and governance gaps.",
  "category.data-privacy.desc":
    "Checks PII handling, data flows, retention policies, and privacy compliance.",
  "category.compliance.desc":
    "Evaluates audit trails, approval workflows, tagging, and regulatory readiness.",
  "category.vendor-risk.desc":
    "Assesses third-party dependencies, credential sharing, and vendor health monitoring.",

  // Workflow info
  "workflowInfo.title": "Workflow Info",
  "workflowInfo.name": "Name",
  "workflowInfo.nodes": "Nodes",
  "workflowInfo.connections": "Connections",
  "workflowInfo.active": "Active",
  "workflowInfo.errorWorkflow": "Error Workflow",
  "workflowInfo.complexity": "Complexity",

  // Upload
  "upload.dropHere": "Drop your n8n workflow JSON here",
  "upload.browse": "or click to browse files",
  "upload.tabUpload": "Upload File",
  "upload.tabPaste": "Paste JSON",
  "upload.pasteArea": "Paste your n8n workflow JSON here...",
  "upload.loadJson": "Load JSON",
  "upload.showJson": "Show raw JSON",
  "upload.hideJson": "Hide raw JSON",

  // Optimize
  "optimize.title": "AI Optimization",
  "optimize.subtitle":
    "Use Claude or Gemini to analyze your workflow and get intelligent optimization suggestions.",
  "optimize.settings": "AI Optimization Settings",
  "optimize.analyzing": "Analyzing workflow...",
  "optimize.run": "Optimize Workflow",
  "optimize.summary": "Summary",
  "optimize.suggestions": "Suggestions",
  "optimize.changes": "Changes",
  "optimize.optimizedWorkflow": "Optimized Workflow",
  "optimize.optimized": "Optimized",
  "optimize.original": "Original",
  "optimize.optimizedJson": "Optimized JSON",
  "optimize.originalJson": "Original JSON",
  "optimize.copy": "Copy",
  "optimize.copied": "Copied",
  "optimize.download": "Download",
  "optimize.json": "JSON",
  "optimize.preview": "Preview",
  "optimize.impact": "impact",
  "optimize.highImpact": "High Impact",
  "optimize.medImpact": "Medium Impact",
  "optimize.lowImpact": "Low Impact",
  "optimize.before": "Before",
  "optimize.after": "After",
  "optimize.compare": "Compare",
  "optimize.copyJson": "Copy JSON",
  "optimize.downloadJson": "Download JSON",
  "optimize.affectedNodes": "Affected nodes",
  "optimize.noSuggestions": "No optimization suggestions — your workflow looks good!",

  // Provider
  "provider.label": "AI Provider",
  "provider.placeholder": "Select AI provider",
  "provider.apiKey": "API Key",
  "provider.getKey": "Get key",
  "provider.enterKey": "Enter API key",
  "provider.keyNote":
    "Your key is stored locally in your browser and sent only to the selected AI provider.",

  // Export
  "export.export": "Export",

  // Preview
  "preview.title": "Workflow Preview",
  "preview.subtitle":
    "Visual graph of your workflow. Nodes are highlighted by audit severity.",
  "preview.critical": "Critical",
  "preview.warning": "Warning",
  "preview.clean": "Clean",
  "preview.errorPath": "Error path",

  // Errors
  "error.auditFailed": "Audit request failed",
  "error.optimizeFailed": "Optimization request failed",
  "error.unknown": "Unknown error occurred",
  "error.fileRead": "Failed to read the file.",
  "error.noWorkflow": "No workflow loaded. Please upload a workflow first.",
  "error.noAuditResult": "No audit results available. Please run an audit first.",
};
