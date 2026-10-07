import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OptimizationResult, AIProvider } from "@/types/audit";
import type { N8nWorkflow, N8nNode } from "@/types/n8n";
import type { AuditResult } from "@/types/audit";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import { n8nWorkflowSchema } from "@/lib/n8n/schema";

/** Try JSON.parse, return null on failure */
function tryParse(text: string): Record<string, unknown> | null {
  try {
    const result = JSON.parse(text);
    if (result && typeof result === "object" && !Array.isArray(result)) return result;
  } catch { /* ignore */ }
  return null;
}

/** Try multiple strategies to extract a JSON object from AI response text */
function extractAndParse(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();

  // Strategy 1: Direct parse (works with Gemini JSON mode)
  const direct = tryParse(trimmed);
  if (direct) return direct;

  // Strategy 2: Strip ALL markdown code fences and parse
  const stripped = trimmed.replace(/```[\w]*\s*\n?/g, "").replace(/\n?\s*```/g, "").trim();
  const fromStripped = tryParse(stripped);
  if (fromStripped) return fromStripped;

  // Strategy 3: Try every '{' as potential JSON start (handles text before JSON)
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === "{") {
      // Try parsing from this '{' to end of string
      const candidate = trimmed.slice(i);
      const parsed = tryParse(candidate);
      if (parsed) return parsed;

      // Try parsing from this '{' to last '}'
      const lastBrace = trimmed.lastIndexOf("}");
      if (lastBrace > i) {
        const sliced = tryParse(trimmed.slice(i, lastBrace + 1));
        if (sliced) return sliced;
      }
    }
  }

  return null;
}

interface NodePatch {
  nodeName: string;
  rename?: string;
  set?: Record<string, unknown>;
}

interface AddNode {
  name: string;
  type: string;
  typeVersion?: number;
  position?: [number, number];
  parameters?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  disabled?: boolean;
  notes?: string;
  continueOnFail?: boolean;
  onError?: string;
}

type PatchConnections = Record<string, Record<string, Array<Array<{ node: string; type: string; index: number }>>>>;

/** Allowed top-level node properties that patches can set */
const PATCHABLE_NODE_KEYS = new Set([
  "continueOnFail", "onError", "notes", "notesInFlow",
  "retryOnFail", "maxTries", "waitBetweenTries",
  "executeOnce", "alwaysOutputData", "disabled",
]);

/** Properties that must NEVER be modified by patches */
const PROTECTED_NODE_KEYS = new Set([
  "credentials", "type", "typeVersion", "position", "id",
]);

/** Valid onError values for n8n */
const VALID_ON_ERROR = new Set(["stopWorkflow", "continueRegularOutput", "continueErrorOutput"]);

/** Deep merge objects — merges nested keys without replacing entire objects */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (
      value && typeof value === "object" && !Array.isArray(value) &&
      result[key] && typeof result[key] === "object" && !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Apply AI-generated patches to the original workflow to produce the optimized version.
 * This avoids asking the AI to reproduce the entire workflow JSON.
 */
function applyPatches(
  original: N8nWorkflow,
  parsed: Record<string, unknown>
): N8nWorkflow {
  // Deep clone to avoid mutating original
  const result: N8nWorkflow = JSON.parse(JSON.stringify(original));

  // Track renames for updating connections: oldName -> newName
  const renames = new Map<string, string>();

  // 1. Apply node patches
  const nodePatches = Array.isArray(parsed.nodePatches) ? parsed.nodePatches as NodePatch[] : [];
  for (const patch of nodePatches) {
    const node = result.nodes.find((n) => n.name === patch.nodeName);
    if (!node) continue;

    // Apply property changes from "set"
    if (patch.set && typeof patch.set === "object") {
      for (const [key, value] of Object.entries(patch.set)) {
        // NEVER modify protected keys (credentials, type, typeVersion, position, id)
        if (PROTECTED_NODE_KEYS.has(key)) continue;

        if (key === "parameters") {
          // Deep merge parameters — preserves existing keys, only modifies/adds specified ones
          if (value && typeof value === "object" && !Array.isArray(value)) {
            node.parameters = deepMerge(
              node.parameters,
              value as Record<string, unknown>
            );
          }
        } else if (key === "onError") {
          // Validate onError value
          if (VALID_ON_ERROR.has(String(value))) {
            node.onError = value as N8nNode["onError"];
          }
        } else if (PATCHABLE_NODE_KEYS.has(key)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (node as any)[key] = value;
        }
      }
    }

    // Apply rename (do this after set so notes can reference the old name)
    if (patch.rename && patch.rename !== node.name) {
      renames.set(node.name, patch.rename);
      node.name = patch.rename;
    }
  }

  // 2. Update existing connections to reflect renames
  if (renames.size > 0) {
    const newConnections: N8nWorkflow["connections"] = {};
    for (const [sourceName, sourceConns] of Object.entries(result.connections)) {
      const newSourceName = renames.get(sourceName) ?? sourceName;
      const updated: typeof sourceConns = {};
      for (const [connType, connArrays] of Object.entries(sourceConns)) {
        updated[connType] = connArrays.map((arr) =>
          arr.map((conn) => ({
            ...conn,
            node: renames.get(conn.node) ?? conn.node,
          }))
        );
      }
      newConnections[newSourceName] = updated;
    }
    result.connections = newConnections;
  }

  // 3. Add new nodes
  const addNodes = Array.isArray(parsed.addNodes) ? parsed.addNodes as AddNode[] : [];
  for (const newNode of addNodes) {
    if (!newNode.name || !newNode.type) continue;
    // Avoid duplicates
    if (result.nodes.some((n) => n.name === newNode.name)) continue;

    // Safe position calculation
    const maxX = result.nodes.length > 0
      ? Math.max(...result.nodes.map((n) => n.position[0]))
      : 300;

    const nodeToAdd: N8nNode = {
      id: crypto.randomUUID(),
      name: newNode.name,
      type: newNode.type,
      typeVersion: newNode.typeVersion ?? 1,
      position: newNode.position ?? [maxX + 200, 300],
      parameters: newNode.parameters ?? {},
    };

    // Pass through optional fields from AI response
    if (newNode.credentials) nodeToAdd.credentials = newNode.credentials as N8nNode["credentials"];
    if (newNode.disabled) nodeToAdd.disabled = newNode.disabled;
    if (newNode.notes) nodeToAdd.notes = newNode.notes;
    if (newNode.continueOnFail) nodeToAdd.continueOnFail = newNode.continueOnFail;
    if (newNode.onError && VALID_ON_ERROR.has(newNode.onError)) {
      nodeToAdd.onError = newNode.onError as N8nNode["onError"];
    }

    result.nodes.push(nodeToAdd);
  }

  // 4. Add new connections (respecting original output counts)
  // Build a map of original output counts per node for validation
  const originalOutputCounts = new Map<string, number>();
  for (const [nodeName, nodeConns] of Object.entries(original.connections)) {
    const mainOutputs = nodeConns.main;
    if (Array.isArray(mainOutputs)) {
      originalOutputCounts.set(nodeName, mainOutputs.length);
    }
  }
  // Also check by renamed names
  for (const [oldName, newName] of renames) {
    const count = originalOutputCounts.get(oldName);
    if (count !== undefined) {
      originalOutputCounts.set(newName, count);
    }
  }

  const addConnections = parsed.addConnections as PatchConnections | undefined;
  if (addConnections && typeof addConnections === "object") {
    for (const [sourceName, sourceConns] of Object.entries(addConnections)) {
      if (!sourceConns || typeof sourceConns !== "object") continue;

      // Use renamed name if applicable
      const actualSource = renames.get(sourceName) ?? sourceName;
      if (!result.connections[actualSource]) {
        result.connections[actualSource] = {};
      }
      for (const [connType, connArrays] of Object.entries(sourceConns)) {
        if (!Array.isArray(connArrays)) continue;

        // Validate: don't create more output arrays than the original node had
        const originalCount = originalOutputCounts.get(actualSource);
        const maxOutputIndex = originalCount !== undefined
          ? originalCount  // respect original output count
          : 1;             // default: assume 1 output for unknown nodes

        if (!result.connections[actualSource][connType]) {
          result.connections[actualSource][connType] = [];
        }
        const existing = result.connections[actualSource][connType];
        for (let i = 0; i < connArrays.length && i < maxOutputIndex; i++) {
          if (!Array.isArray(connArrays[i])) continue;
          if (!existing[i]) existing[i] = [];
          for (const conn of connArrays[i]) {
            if (!conn || typeof conn.node !== "string") continue;
            const targetName = renames.get(conn.node) ?? conn.node;
            // Validate target node exists
            if (!result.nodes.some((n) => n.name === targetName)) continue;
            // Avoid duplicate connections
            const isDuplicate = existing[i].some(
              (e) => e.node === targetName && e.type === conn.type && e.index === conn.index
            );
            if (!isDuplicate) {
              existing[i].push({
                node: targetName,
                type: String(conn.type ?? "main"),
                index: Number(conn.index ?? 0),
              });
            }
          }
        }
      }
    }
  }

  // 5. Apply workflow settings
  const workflowSettings = parsed.workflowSettings as Record<string, unknown> | undefined;
  if (workflowSettings && typeof workflowSettings === "object") {
    const safeSettings: Record<string, unknown> = { ...(result.settings ?? {}) };
    for (const [key, value] of Object.entries(workflowSettings)) {
      // Validate enum values
      if (key === "executionOrder" && !["v0", "v1"].includes(String(value))) continue;
      if (key === "saveDataErrorExecution" && !["DEFAULT", "all", "none"].includes(String(value))) continue;
      if (key === "saveDataSuccessExecution" && !["DEFAULT", "all", "none"].includes(String(value))) continue;
      safeSettings[key] = value;
    }
    result.settings = safeSettings as N8nWorkflow["settings"];
  }

  // 6. Validate against n8n schema — strip invalid fields
  const validated = n8nWorkflowSchema.safeParse(result);
  if (validated.success) {
    return validated.data as N8nWorkflow;
  }

  // Schema validation failed — return the result as-is (best effort)
  return result;
}

function normalizeImpact(impact: unknown): "high" | "medium" | "low" {
  const val = String(impact ?? "").toLowerCase();
  if (val === "high" || val === "critical") return "high";
  if (val === "medium" || val === "moderate" || val === "warning") return "medium";
  return "low";
}

function normalizeSuggestions(
  raw: unknown[]
): OptimizationResult["suggestions"] {
  return raw.map((item: unknown, i: number) => {
    const s = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(s.id ?? `opt-${i + 1}`),
      title: String(s.title ?? "Untitled"),
      description: String(s.description ?? ""),
      impact: normalizeImpact(s.impact),
      category: String(s.category ?? "best-practices") as import("@/types/audit").AuditCategory,
      changes: String(s.changes ?? ""),
      affectedNodes: Array.isArray(s.affectedNodes)
        ? s.affectedNodes.map(String)
        : [],
    };
  });
}

function parseAIResponse(
  text: string,
  provider: AIProvider,
  originalWorkflow: N8nWorkflow
): OptimizationResult {
  // Try robust multi-strategy JSON extraction
  const parsed = extractAndParse(text);

  if (parsed) {
    // Always apply patches to produce the optimized workflow
    let optimizedWorkflow: N8nWorkflow;
    try {
      optimizedWorkflow = applyPatches(originalWorkflow, parsed);
    } catch {
      // Patch application failed — return deep clone of original
      optimizedWorkflow = JSON.parse(JSON.stringify(originalWorkflow));
    }

    return {
      suggestions: Array.isArray(parsed.suggestions)
        ? normalizeSuggestions(parsed.suggestions)
        : [],
      optimizedWorkflow,
      explanation: String(parsed.explanation ?? "No explanation provided."),
      provider,
    };
  }

  // Last resort — could not parse JSON at all, return original as optimized
  return {
    suggestions: [],
    optimizedWorkflow: JSON.parse(JSON.stringify(originalWorkflow)),
    explanation: text.length > 2000 ? text.slice(0, 2000) + "…" : text.trim(),
    provider,
  };
}

export async function callClaude(
  apiKey: string,
  workflow: N8nWorkflow,
  auditResult: AuditResult,
  locale?: string
): Promise<OptimizationResult> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    system: buildSystemPrompt(locale),
    messages: [{ role: "user", content: buildUserPrompt(workflow, auditResult) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return parseAIResponse(textBlock.text, "claude", workflow);
}

export async function callGemini(
  apiKey: string,
  workflow: N8nWorkflow,
  auditResult: AuditResult,
  locale?: string
): Promise<OptimizationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemPrompt(locale),
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 65536,
    },
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: buildUserPrompt(workflow, auditResult) }],
      },
    ],
  });

  const text = result.response.text();
  return parseAIResponse(text, "gemini", workflow);
}
