export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string | null; name: string }>;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  continueOnFail?: boolean;
  onError?: "stopWorkflow" | "continueRegularOutput" | "continueErrorOutput";
  webhookId?: string;
}

export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

export type N8nNodeConnections = Record<string, N8nConnection[][]>;
export type N8nConnections = Record<string, N8nNodeConnections>;

export interface N8nWorkflowSettings {
  timezone?: string;
  errorWorkflow?: string;
  saveDataErrorExecution?: "DEFAULT" | "all" | "none";
  saveDataSuccessExecution?: "DEFAULT" | "all" | "none";
  saveManualExecutions?: "DEFAULT" | boolean;
  saveExecutionProgress?: "DEFAULT" | boolean;
  executionTimeout?: number;
  executionOrder?: "v0" | "v1";
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: N8nWorkflowSettings;
  pinData?: Record<string, unknown>;
  versionId?: string;
  meta?: Record<string, unknown>;
  tags?: Array<{ id: string; name: string }>;
}
