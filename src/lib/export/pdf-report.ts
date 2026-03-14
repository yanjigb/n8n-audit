import type { AuditResult } from "@/types/audit";
import { CATEGORY_LABELS } from "@/lib/audit/constants";
import jsPDF from "jspdf";

/** Load Roboto font (supports Vietnamese) and register it with jsPDF */
async function registerUnicodeFont(doc: jsPDF): Promise<void> {
  try {
    const res = await fetch("/fonts/Roboto-Regular.ttf");
    if (!res.ok) return;
    const buffer = await res.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    doc.addFileToVFS("Roboto-Regular.ttf", base64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto", "normal");
  } catch {
    // Font loading failed — fall back to default Helvetica
  }
}

export async function downloadPdfReport(result: AuditResult) {
  const doc = new jsPDF();
  await registerUnicodeFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.text("n8n Workflow Audit Report", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Workflow name
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Workflow: ${result.workflowMeta.name}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 8;
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(result.timestamp).toLocaleString()}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 15;

  // Overall score
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text(`Overall Score: ${result.overallScore}/100`, 20, y);
  y += 10;

  // Summary
  doc.setFontSize(10);
  doc.text(
    `Total Findings: ${result.totalFindings}  |  Critical: ${result.criticalFindings}  |  Warnings: ${result.warningFindings}  |  Info: ${result.infoFindings}`,
    20,
    y
  );
  y += 10;

  // Workflow info
  doc.text(
    `Nodes: ${result.workflowMeta.nodeCount}  |  Connections: ${result.workflowMeta.connectionCount}  |  Active: ${result.workflowMeta.isActive ? "Yes" : "No"}`,
    20,
    y
  );
  y += 15;

  // Categories
  for (const [key, cat] of Object.entries(result.categories)) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(
      `${CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS]} — Score: ${cat.score}/100`,
      20,
      y
    );
    y += 8;

    doc.setFontSize(9);
    for (const finding of cat.findings) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const severityLabel = finding.severity.toUpperCase();
      doc.setTextColor(
        finding.severity === "critical" ? 200 : finding.severity === "warning" ? 180 : 100,
        finding.severity === "critical" ? 0 : finding.severity === "warning" ? 140 : 100,
        0
      );
      const line = `[${severityLabel}] ${finding.ruleId}: ${finding.title}`;
      doc.text(line, 25, y);
      y += 5;
      doc.setTextColor(80);
      const desc = doc.splitTextToSize(finding.description, pageWidth - 50);
      doc.text(desc, 30, y);
      y += desc.length * 4 + 3;
    }

    if (cat.findings.length === 0) {
      doc.setTextColor(0, 150, 0);
      doc.text("No issues found.", 25, y);
      y += 6;
    }

    y += 5;
  }

  doc.save(
    `n8n-audit-${result.workflowMeta.name.replace(/\s+/g, "-").toLowerCase()}.pdf`
  );
}
