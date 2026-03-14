"use client";

import { useState, useMemo } from "react";
import type { AuditFinding, Severity } from "@/types/audit";
import { FindingItem } from "./finding-item";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface FindingListProps {
  findings: AuditFinding[];
}

const SEVERITY_ORDER: Severity[] = ["critical", "warning", "info"];

const SEVERITY_LABEL_KEYS: Record<"all" | Severity, string> = {
  all: "audit.all",
  critical: "audit.critical",
  warning: "audit.warning",
  info: "audit.info",
};

function matchesSearch(finding: AuditFinding, query: string): boolean {
  const q = query.toLowerCase();
  return (
    finding.title.toLowerCase().includes(q) ||
    finding.description.toLowerCase().includes(q) ||
    finding.ruleId.toLowerCase().includes(q) ||
    (finding.affectedNodes?.some((n) => n.toLowerCase().includes(q)) ?? false)
  );
}

export function FindingList({ findings }: FindingListProps) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const searchFiltered = useMemo(
    () =>
      search.trim()
        ? findings.filter((f) => matchesSearch(f, search.trim()))
        : findings,
    [findings, search]
  );

  const filtered =
    filter === "all"
      ? searchFiltered
      : searchFiltered.filter((f) => f.severity === filter);

  const sorted = [...filtered].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  if (findings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">{t("audit.noIssues")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("audit.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>
      <div className="flex gap-1">
        {(["all", "critical", "warning", "info"] as const).map((s) => {
          const count =
            s === "all"
              ? searchFiltered.length
              : searchFiltered.filter((f) => f.severity === s).length;
          if (count === 0 && s !== "all") return null;
          return (
            <Button
              key={s}
              variant={filter === s ? "default" : "ghost"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setFilter(s)}
            >
              {t(SEVERITY_LABEL_KEYS[s])} ({count})
            </Button>
          );
        })}
      </div>
      <Accordion type="multiple" className="w-full">
        {sorted.map((finding) => (
          <FindingItem key={finding.id} finding={finding} highlight={search.trim()} />
        ))}
      </Accordion>
    </div>
  );
}
