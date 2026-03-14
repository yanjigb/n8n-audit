"use client";

import { useCallback } from "react";
import { useAuditStore } from "@/stores/audit-store";
import { parseWorkflowJson } from "@/lib/n8n/parser";

export function useWorkflow() {
  const { workflow, rawJson, parseError, setRawJson, setWorkflow, setParseError, reset } =
    useAuditStore();

  const loadFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawJson(text);
        const result = parseWorkflowJson(text);
        if (result.success) {
          setWorkflow(result.workflow);
        } else {
          setParseError(result.error);
        }
      };
      reader.onerror = () => {
        setParseError("Failed to read the file.");
      };
      reader.readAsText(file);
    },
    [setRawJson, setWorkflow, setParseError]
  );

  const loadFromText = useCallback(
    (text: string) => {
      setRawJson(text);
      const result = parseWorkflowJson(text);
      if (result.success) {
        setWorkflow(result.workflow);
      } else {
        setParseError(result.error);
      }
    },
    [setRawJson, setWorkflow, setParseError]
  );

  return { workflow, rawJson, parseError, loadFromFile, loadFromText, reset };
}
