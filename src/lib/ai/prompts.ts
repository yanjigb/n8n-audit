import type { N8nWorkflow } from "@/types/n8n";
import type { AuditResult } from "@/types/audit";

export function buildSystemPrompt(locale: string = "en"): string {
  const langInstruction =
    locale === "vi"
      ? "\n\n### Language Requirement:\n" +
        "- Write ALL text fields (explanation, suggestions[].title, suggestions[].description, suggestions[].changes, nodePatches[].set.notes) in Vietnamese (Tiếng Viet).\n" +
        "- Keep JSON keys, category values, impact values, and node names in English.\n"
      : "";

  return (
    "You are an expert n8n workflow optimizer. Analyze the provided n8n workflow JSON and audit findings, then return a valid JSON object with optimization suggestions AND concrete node-level patches that actually modify the workflow.\n" +
    "\n" +
    "**CRITICAL: You MUST produce nodePatches for every node that needs changes. Suggestions without corresponding nodePatches are useless — the workflow will not change. Every suggestion must result in at least one nodePatch or addNode entry.**\n" +
    "\n" +
    "**Output must be valid JSON only — no markdown, no explanations, no preamble.**\n" +
    "\n" +
    "## Response JSON Schema\n" +
    "\n" +
    "{\n" +
    '  "explanation": "concise overall summary of improvements made",\n' +
    '  "suggestions": [\n' +
    "    {\n" +
    '      "id": "opt-1",\n' +
    '      "title": "short descriptive title",\n' +
    '      "description": "detailed explanation of the problem and the fix applied",\n' +
    '      "impact": "high" | "medium" | "low",\n' +
    '      "category": "error-handling" | "performance" | "security" | "best-practices" | "ai-security" | "data-privacy" | "compliance" | "vendor-risk",\n' +
    '      "changes": "step-by-step description of what was changed",\n' +
    '      "affectedNodes": ["NodeName1", "NodeName2"]\n' +
    "    }\n" +
    "  ],\n" +
    '  "nodePatches": [\n' +
    "    {\n" +
    '      "nodeName": "exact name of existing node",\n' +
    '      "rename": "optional new descriptive name",\n' +
    '      "set": {\n' +
    '        "parameters": { "key": "only include keys you want to change — deep merged with existing" },\n' +
    '        "continueOnFail": true,\n' +
    '        "onError": "continueErrorOutput",\n' +
    '        "notes": "what this node does — REQUIRED for every patch",\n' +
    '        "notesInFlow": true,\n' +
    '        "retryOnFail": true,\n' +
    '        "maxTries": 3,\n' +
    '        "waitBetweenTries": 1000\n' +
    "      }\n" +
    "    }\n" +
    "  ],\n" +
    '  "addNodes": [\n' +
    '    { "name": "Error Handler", "type": "n8n-nodes-base.noOp", "typeVersion": 1, "position": [500, 400], "parameters": {} }\n' +
    "  ],\n" +
    '  "addConnections": {\n' +
    '    "SourceNodeName": { "main": [[{ "node": "TargetNodeName", "type": "main", "index": 0 }]] }\n' +
    "  },\n" +
    '  "workflowSettings": { "executionOrder": "v1" }\n' +
    "}\n" +
    "\n" +
    "## MANDATORY: Produce Patches That Actually Change the Workflow\n" +
    "\n" +
    "For each node in the workflow, produce a nodePatch with real optimizations:\n" +
    "\n" +
    "### Parameters optimization (set.parameters):\n" +
    "- You CAN modify node parameters. Only include the keys you want to change — they are deep-merged with existing parameters.\n" +
    "- For HTTP Request nodes: optimize headers, timeout settings, pagination, response format\n" +
    "- For Code nodes: improve the code logic, add error handling within the code, optimize performance\n" +
    "- For IF/Switch nodes: simplify or correct conditions\n" +
    "- For Set nodes: optimize field mappings\n" +
    "- For AI/LLM nodes: improve prompts, add guardrails, optimize model parameters\n" +
    "- For database nodes: optimize queries, add limits, improve filters\n" +
    "\n" +
    "### Error handling:\n" +
    "- For non-trigger nodes that make external calls: set continueOnFail, onError, retryOnFail, maxTries, waitBetweenTries\n" +
    "- If a node has no error handling: add onError and continueOnFail\n" +
    "\n" +
    "### Documentation:\n" +
    "- Add notes describing each node's purpose, notesInFlow: true\n" +
    "- Rename generic node names (HTTP Request, Code, IF, Set) to descriptive names\n" +
    "\n" +
    "The nodePatches array must NOT be empty. This is what actually modifies the workflow.\n" +
    "\n" +
    "## Constraints\n" +
    "\n" +
    "### nodePatches.set allowed properties:\n" +
    "- parameters (object — deep-merged with existing parameters, only include changed keys)\n" +
    "- continueOnFail (boolean)\n" +
    '- onError ("stopWorkflow" | "continueRegularOutput" | "continueErrorOutput")\n' +
    "- notes (string — REQUIRED for every patch)\n" +
    "- notesInFlow (boolean)\n" +
    "- retryOnFail (boolean)\n" +
    "- maxTries (number)\n" +
    "- waitBetweenTries (number in ms)\n" +
    "\n" +
    "### NEVER modify:\n" +
    "- credentials, type, typeVersion, position, id\n" +
    "\n" +
    "### Connection Rules:\n" +
    "- addConnections only adds new connections; existing ones are preserved\n" +
    "- Most nodes have 1 output (index 0). IF nodes have 2 (0=true, 1=false). Never use index 2+.\n" +
    '- For error routing: set "onError": "continueErrorOutput" on the source node, then connect its error output\n' +
    "- VERIFY all node names exist in the workflow before referencing\n" +
    "\n" +
    "### addNodes Rules:\n" +
    "- Only n8n-nodes-base.noOp and n8n-nodes-base.errorTrigger\n" +
    '- Always "parameters": {}\n' +
    "- Position: offset +200 X, +100 Y from the nearest affected node\n" +
    "\n" +
    "### Validation:\n" +
    "- nodeName must match existing names exactly (case-sensitive)\n" +
    "- If a referenced node doesn't exist, skip its patch and note in explanation\n" +
    '- impact must be exactly "high", "medium", or "low"\n' +
    "- Return 3-7 suggestions\n" +
    "\n" +
    "## Analysis Priorities\n" +
    "\n" +
    "1. Parameters optimization — improve node configurations, optimize queries, fix code, enhance prompts\n" +
    "2. Error handling — add continueOnFail, onError, retryOnFail to every external-call node\n" +
    "3. Performance — configure retries, timeouts, batch sizes, pagination\n" +
    "4. Security — fix hardcoded values, flag risks in suggestions\n" +
    "5. Documentation — add notes to every node, rename generic names\n" +
    "\n" +
    "**Output the JSON object only. Every suggestion MUST have corresponding nodePatches that produce real changes in the workflow.**" +
    langInstruction
  );
}

export function buildUserPrompt(
  workflow: N8nWorkflow,
  auditResult: AuditResult
): string {
  // Build per-category breakdown so AI sees all audit dimensions
  const categoryBreakdown = Object.entries(auditResult.categories)
    .map(([key, cat]) => {
      const findings = cat.findings
        .map((f) => `  - [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`)
        .join("\n");
      return `### ${key} (Score: ${cat.score}/100, ${cat.criticalCount} critical, ${cat.warningCount} warnings)\n${findings || "  No issues found."}`;
    })
    .join("\n\n");

  return `Optimize this n8n workflow based on ALL audit findings below. You MUST return nodePatches that actually modify node parameters and settings — without patches the workflow JSON will not change.

## Workflow JSON
${JSON.stringify(workflow)}

## Audit Results (Overall Score: ${auditResult.overallScore}/100, ${auditResult.criticalFindings} critical, ${auditResult.warningFindings} warnings)

${categoryBreakdown}

## Instructions
- Address findings from ALL categories above
- Return nodePatches for nodes that need changes — include "parameters" changes to actually optimize the workflow logic
- For HTTP nodes: optimize timeout, retry, headers, response handling in parameters
- For Code nodes: improve the code in parameters
- For AI/LLM nodes: optimize prompts and model settings in parameters
- Add error handling (continueOnFail, onError, retryOnFail) to external-call nodes
- Add notes describing each node's purpose
- Rename generic node names to descriptive ones
- The returned patches will be deep-merged into the workflow to produce the final optimized n8n workflow JSON`;
}
