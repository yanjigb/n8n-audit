"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dropzone } from "@/components/upload/dropzone";
import { JsonPreview } from "@/components/upload/json-preview";
import { useWorkflow } from "@/hooks/use-workflow";
import { useAudit } from "@/hooks/use-audit";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useAuditStore } from "@/stores/audit-store";
import { ProviderSelector } from "@/components/optimize/provider-selector";
import { ApiKeyInput } from "@/components/optimize/api-key-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/lib/i18n";
import {
  Shield,
  Zap,
  AlertTriangle,
  BookOpen,
  Brain,
  Fingerprint,
  ClipboardCheck,
  Link2,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { workflow, rawJson, parseError, loadFromFile, loadFromText } =
    useWorkflow();
  const { executeAudit, auditResult, isAuditing, auditError } = useAudit();
  const { getKey, setKey } = useApiKeys();
  const { selectedProvider, setSelectedProvider } = useAuditStore();
  const [localKey, setLocalKey] = useState(() => getKey(selectedProvider) ?? "");

  useEffect(() => {
    if (auditResult) {
      router.push("/audit");
    }
  }, [auditResult, router]);

  const handleAudit = () => {
    if (!localKey.trim() || !workflow) return;
    setKey(selectedProvider, localKey);
    executeAudit(localKey);
  };

  const features = [
    {
      icon: AlertTriangle,
      title: t("home.errorHandling"),
      desc: t("home.errorHandlingDesc"),
    },
    {
      icon: Zap,
      title: t("home.performance"),
      desc: t("home.performanceDesc"),
    },
    {
      icon: Shield,
      title: t("home.security"),
      desc: t("home.securityDesc"),
    },
    {
      icon: BookOpen,
      title: t("home.bestPractices"),
      desc: t("home.bestPracticesDesc"),
    },
    {
      icon: Brain,
      title: t("home.aiSecurity"),
      desc: t("home.aiSecurityDesc"),
    },
    {
      icon: Fingerprint,
      title: t("home.dataPrivacy"),
      desc: t("home.dataPrivacyDesc"),
    },
    {
      icon: ClipboardCheck,
      title: t("home.compliance"),
      desc: t("home.complianceDesc"),
    },
    {
      icon: Link2,
      title: t("home.vendorRisk"),
      desc: t("home.vendorRiskDesc"),
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
      <div className="text-center mb-10 space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("home.title")}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t("home.subtitle")}
        </p>
      </div>

      {!workflow ? (
        <>
          <Dropzone
            onFile={loadFromFile}
            onPaste={loadFromText}
            error={parseError}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16  w-full">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center p-4 rounded-lg border bg-card"
              >
                <Icon className="h-6 w-6 mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="w-full max-w-xl mx-auto space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t("home.aiPoweredAudit")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium">{workflow.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {workflow.nodes.length} nodes &middot;{" "}
                  {workflow.active ? t("common.active") : t("common.inactive")}
                </p>
              </div>

              <ProviderSelector
                value={selectedProvider}
                onChange={(p) => {
                  setSelectedProvider(p);
                  setLocalKey(getKey(p) ?? "");
                }}
              />

              <ApiKeyInput
                provider={selectedProvider}
                value={localKey}
                onChange={setLocalKey}
              />

              <Button
                onClick={handleAudit}
                disabled={isAuditing || !localKey.trim()}
                className="w-full"
              >
                {isAuditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("home.analyzing")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("home.runAudit")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {auditError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{auditError}</AlertDescription>
            </Alert>
          )}

          {rawJson && <JsonPreview json={rawJson} />}
        </div>
      )}
    </div>
  );
}
