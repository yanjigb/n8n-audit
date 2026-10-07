"use client";

import type { AIProvider } from "@/types/audit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_PROVIDERS } from "@/lib/ai/types";
import { useTranslation } from "@/lib/i18n";

interface ProviderSelectorProps {
  value: AIProvider;
  onChange: (value: AIProvider) => void;
}

export function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{t("provider.label")}</label>
      <Select value={value} onValueChange={(v) => onChange(v as AIProvider)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("provider.placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {AI_PROVIDERS.map((p) => (
            <SelectItem key={p.provider} value={p.provider}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
