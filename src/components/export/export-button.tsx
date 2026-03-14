"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { useAuditStore } from "@/stores/audit-store";
import { downloadJsonReport } from "@/lib/export/json-report";
import { downloadPdfReport } from "@/lib/export/pdf-report";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export function ExportButton() {
  const auditResult = useAuditStore((s) => s.auditResult);
  const [format, setFormat] = useState<"json" | "pdf">("json");
  const { t } = useTranslation();

  if (!auditResult) return null;

  const handleExport = async () => {
    if (format === "json") {
      downloadJsonReport(auditResult);
    } else {
      await downloadPdfReport(auditResult);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={format}
        onValueChange={(v) => setFormat(v as "json" | "pdf")}
      >
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-1 h-3 w-3" />
        {t("export.export")}
      </Button>
    </div>
  );
}
