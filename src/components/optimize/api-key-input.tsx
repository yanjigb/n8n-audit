"use client";

import { useState } from "react";
import type { AIProvider } from "@/types/audit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import { AI_PROVIDERS } from "@/lib/ai/types";
import { useTranslation } from "@/lib/i18n";

interface ApiKeyInputProps {
  provider: AIProvider;
  value: string;
  onChange: (value: string) => void;
}

export function ApiKeyInput({ provider, value, onChange }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);
  const config = AI_PROVIDERS.find((p) => p.provider === provider);
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{t("provider.apiKey")}</label>
        {config && (
          <a
            href={config.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
          >
            {t("provider.getKey")} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={visible ? "text" : "password"}
            placeholder={config?.placeholder ?? t("provider.enterKey")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setVisible(!visible)}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("provider.keyNote")}
      </p>
    </div>
  );
}
