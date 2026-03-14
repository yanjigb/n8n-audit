import { n8nWorkflowSchema } from "./schema";
import type { N8nWorkflow } from "@/types/n8n";

export interface ParseResult {
  success: true;
  workflow: N8nWorkflow;
}

export interface ParseError {
  success: false;
  error: string;
}

export function parseWorkflowJson(raw: string): ParseResult | ParseError {
  const text = raw.trim();
  let json: unknown;

  // Strategy 1: direct parse
  try {
    json = JSON.parse(text);
    // If the outer parse returned a string (double-encoded JSON), parse the inner string
    if (typeof json === "string") {
      json = JSON.parse(json);
    }
  } catch {
    // Strategy 2: extract between first '{' and last '}' — handles surrounding quotes or extra text
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        json = JSON.parse(text.slice(start, end + 1));
      } catch {
        return { success: false, error: "Invalid JSON: could not parse the file." };
      }
    } else {
      return { success: false, error: "Invalid JSON: could not parse the file." };
    }
  }

  const result = n8nWorkflowSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return {
      success: false,
      error: `Invalid n8n workflow format: ${issues}`,
    };
  }

  return { success: true, workflow: result.data as N8nWorkflow };
}
