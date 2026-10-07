"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileJson, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";

interface DropzoneProps {
  onFile: (file: File) => void;
  onPaste: (text: string) => void;
  error?: string | null;
}

export function Dropzone({ onFile, onPaste, error }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  // Switch to paste tab and fill textarea when user presses Ctrl/Cmd+V outside inputs
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement;
      // If already in our textarea, let the browser handle it natively
      if (target === textareaRef.current) return;
      // Don't intercept other inputs
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const text = e.clipboardData?.getData("text") ?? "";
      const trimmed = text.trim();
      // Accept text that looks like a JSON object (starts with { or starts with " wrapping {)
      if (trimmed.startsWith("{") || trimmed.includes('"nodes"') || trimmed.includes('"connections"')) {
        setActiveTab("paste");
        setPasteText(text);
        // Auto-load after a tick so the tab switch renders first
        setTimeout(() => onPaste(text), 0);
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onPaste]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".json")) onFile(file);
    },
    [onFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  // Auto-load when user pastes directly into the textarea
  const handleTextareaPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const text = e.clipboardData.getData("text");
      const trimmed = text.trim();
      if (trimmed.startsWith("{") || trimmed.includes('"nodes"') || trimmed.includes('"connections"')) {
        setPasteText(text);
        setTimeout(() => onPaste(text), 0);
      }
    },
    [onPaste]
  );

  const handleLoadJson = useCallback(() => {
    if (pasteText.trim()) onPaste(pasteText);
  }, [pasteText, onPaste]);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "paste")}>
        <TabsList className="w-full">
          <TabsTrigger value="upload" className="flex-1">
            {t("upload.tabUpload")}
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex-1">
            {t("upload.tabPaste")}
          </TabsTrigger>
        </TabsList>

        {/* Upload tab */}
        <TabsContent value="upload">
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="rounded-full bg-muted p-4">
                {isDragging ? (
                  <FileJson className="h-8 w-8 text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{t("upload.dropHere")}</p>
                <p className="text-xs text-muted-foreground">{t("upload.browse")}</p>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileInput}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paste tab */}
        <TabsContent value="paste" className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder={t("upload.pasteArea")}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            onPaste={handleTextareaPaste}
            className="font-mono text-xs h-56 resize-none"
            spellCheck={false}
          />
          <Button
            className="w-full"
            disabled={!pasteText.trim()}
            onClick={handleLoadJson}
          >
            {t("upload.loadJson")}
          </Button>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
