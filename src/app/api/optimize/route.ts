import { NextRequest, NextResponse } from "next/server";
import { callClaude, callGemini } from "@/lib/ai/providers";
import type { N8nWorkflow } from "@/types/n8n";
import type { AuditResult, AIProvider } from "@/types/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, auditResult, provider, apiKey, locale } = body as {
      workflow: N8nWorkflow;
      auditResult: AuditResult;
      provider: AIProvider;
      apiKey: string;
      locale?: string;
    };

    if (!apiKey || !workflow || !provider || !auditResult) {
      return NextResponse.json(
        { error: "Missing required fields: workflow, auditResult, provider, apiKey" },
        { status: 400 }
      );
    }

    if (provider !== "claude" && provider !== "gemini") {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'claude' or 'gemini'." },
        { status: 400 }
      );
    }

    const result =
      provider === "claude"
        ? await callClaude(apiKey, workflow, auditResult, locale)
        : await callGemini(apiKey, workflow, auditResult, locale);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/optimize] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
