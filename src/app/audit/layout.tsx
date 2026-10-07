"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuditStore } from "@/stores/audit-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Separator } from "@/components/ui/separator";

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const auditResult = useAuditStore((s) => s.auditResult);

  useEffect(() => {
    if (!auditResult) {
      router.push("/");
    }
  }, [auditResult, router]);

  if (!auditResult) return null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r">
        <Sidebar />
      </aside>
      <Separator orientation="vertical" className="hidden md:block" />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
