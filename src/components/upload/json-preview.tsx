"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n";

interface JsonPreviewProps {
  json: string;
}

export function JsonPreview({ json }: JsonPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  let formatted: string;
  try {
    formatted = JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    formatted = json;
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronUp className="mr-1 h-3 w-3" />
        ) : (
          <ChevronDown className="mr-1 h-3 w-3" />
        )}
        {isExpanded ? t("upload.hideJson") : t("upload.showJson")}
      </Button>
      {isExpanded && (
        <ScrollArea className="mt-2 h-64 rounded-md border bg-muted/50">
          <pre className="p-4 text-xs font-mono">{formatted}</pre>
        </ScrollArea>
      )}
    </div>
  );
}
