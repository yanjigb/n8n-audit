import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { N8nWorkflow } from "@/types/n8n";
import type { AIProvider, AuditResult, AuditCategory, CategoryScore } from "@/types/audit";
import { buildAuditSystemPrompt, buildAuditUserPrompt } from "@/lib/ai/audit-prompts";
import { calculateCategoryScore } from "@/lib/audit/scoring";

function extractJson(text: string): string {
  let cleaned = text.trim();

  // Strip markdown code fences in all variations
  cleaned = cleaned.replace(/^```[\w]*\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
  cleaned = cleaned.trim();

  // If still not starting with '{', find the outermost JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function parseAuditResponse(text: string): AuditResult {
  const jsonStr = extractJson(text);
  const parsed = JSON.parse(jsonStr);

  const categoryKeys: AuditCategory[] = [
    "error-handling",
    "performance",
    "security",
    "best-practices",
    "ai-security",
    "data-privacy",
    "compliance",
    "vendor-risk",
  ];

  const categories = {} as Record<AuditCategory, CategoryScore>;
  for (const key of categoryKeys) {
    const cat = parsed.categories?.[key] ?? { score: 100, findings: [] };
    const findings = (cat.findings ?? []).map(
      (f: Record<string, unknown>, i: number) => ({
        id: f.id ?? `${key}-${i}`,
        ruleId: f.ruleId ?? `${key}-${i}`,
        category: key,
        severity: f.severity ?? "info",
        title: f.title ?? "Unknown",
        description: f.description ?? "",
        recommendation: f.recommendation ?? "",
        affectedNodes: f.affectedNodes ?? [],
        affectedNodeIds: f.affectedNodeIds ?? [],
      })
    );

    // Recalculate score from actual findings instead of trusting AI's score
    categories[key] = calculateCategoryScore(key, findings);
  }

  const allFindings = Object.values(categories).flatMap((c) => c.findings);

  return {
    overallScore: Math.max(
      0,
      Math.min(100, Math.round(parsed.overallScore ?? 50))
    ),
    categories,
    totalFindings: allFindings.length,
    criticalFindings: allFindings.filter((f) => f.severity === "critical")
      .length,
    warningFindings: allFindings.filter((f) => f.severity === "warning").length,
    infoFindings: allFindings.filter((f) => f.severity === "info").length,
    workflowMeta: {
      name: parsed.workflowMeta?.name ?? "Unknown",
      nodeCount: parsed.workflowMeta?.nodeCount ?? 0,
      connectionCount: parsed.workflowMeta?.connectionCount ?? 0,
      hasErrorWorkflow: parsed.workflowMeta?.hasErrorWorkflow ?? false,
      isActive: parsed.workflowMeta?.isActive ?? false,
      complexityScore: parsed.workflowMeta?.complexityScore ?? 0,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, provider, apiKey, locale } = body as {
      workflow: N8nWorkflow;
      provider: AIProvider;
      apiKey: string;
      locale?: string;
    };

    if (!apiKey || !workflow || !provider) {
      return NextResponse.json(
        { error: "Missing required fields: workflow, provider, apiKey" },
        { status: 400 }
      );
    }

    const systemPrompt = buildAuditSystemPrompt(locale);
    const userPrompt = buildAuditUserPrompt(workflow);
    let responseText: string;

    if (provider === "claude") {
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }
      responseText = textBlock.text;
    } else if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });
      responseText = result.response.text();
    } else {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'claude' or 'gemini'." },
        { status: 400 }
      );
    }

    const auditResult = parseAuditResponse(responseText);
    return NextResponse.json(auditResult);
  } catch (err) {
    console.error("[/api/audit] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
