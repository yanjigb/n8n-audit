"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuditStore } from "@/stores/audit-store";
import { useTranslation } from "@/lib/i18n";
import {
  LayoutDashboard,
  AlertTriangle,
  Zap,
  Shield,
  BookOpen,
  Sparkles,
  Eye,
  Brain,
  Fingerprint,
  ClipboardCheck,
  Link2,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  category?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/audit", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/audit/preview", labelKey: "sidebar.preview", icon: Eye },
  {
    href: "/audit/error-handling",
    labelKey: "sidebar.errorHandling",
    icon: AlertTriangle,
    category: "error-handling",
  },
  {
    href: "/audit/performance",
    labelKey: "sidebar.performance",
    icon: Zap,
    category: "performance",
  },
  {
    href: "/audit/security",
    labelKey: "sidebar.security",
    icon: Shield,
    category: "security",
  },
  {
    href: "/audit/best-practices",
    labelKey: "sidebar.bestPractices",
    icon: BookOpen,
    category: "best-practices",
  },
  {
    href: "/audit/ai-security",
    labelKey: "sidebar.aiSecurity",
    icon: Brain,
    category: "ai-security",
  },
  {
    href: "/audit/data-privacy",
    labelKey: "sidebar.dataPrivacy",
    icon: Fingerprint,
    category: "data-privacy",
  },
  {
    href: "/audit/compliance",
    labelKey: "sidebar.compliance",
    icon: ClipboardCheck,
    category: "compliance",
  },
  {
    href: "/audit/vendor-risk",
    labelKey: "sidebar.vendorRisk",
    icon: Link2,
    category: "vendor-risk",
  },
  { href: "/audit/optimize", labelKey: "sidebar.optimize", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const auditResult = useAuditStore((s) => s.auditResult);
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ href, labelKey, icon: Icon, category }) => {
        const isActive = pathname === href;
        const findingsCount =
          category && auditResult
            ? auditResult.categories[
                category as keyof typeof auditResult.categories
              ]?.findings.length
            : undefined;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{t(labelKey)}</span>
            {findingsCount !== undefined && findingsCount > 0 && (
              <span
                className={cn(
                  "text-xs font-mono",
                  isActive ? "text-primary-foreground/80" : ""
                )}
              >
                {findingsCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
