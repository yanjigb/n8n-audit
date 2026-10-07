import { z } from "zod";

const nodeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    typeVersion: z.number(),
    position: z.tuple([z.number(), z.number()]),
    parameters: z.record(z.string(), z.unknown()).default({}),
    credentials: z
      .record(z.string(), z.object({ id: z.string().nullable(), name: z.string() }))
      .optional(),
    disabled: z.boolean().optional(),
    notes: z.string().optional(),
    notesInFlow: z.boolean().optional(),
    retryOnFail: z.boolean().optional(),
    maxTries: z.number().optional(),
    waitBetweenTries: z.number().optional(),
    alwaysOutputData: z.boolean().optional(),
    executeOnce: z.boolean().optional(),
    continueOnFail: z.boolean().optional(),
    onError: z
      .enum(["stopWorkflow", "continueRegularOutput", "continueErrorOutput"])
      .optional(),
    webhookId: z.string().optional(),
  })
  .passthrough();

const connectionSchema = z.object({
  node: z.string(),
  type: z.string(),
  index: z.number(),
});

const settingsSchema = z
  .object({
    timezone: z.string().optional(),
    errorWorkflow: z.string().optional(),
    saveDataErrorExecution: z.enum(["DEFAULT", "all", "none"]).optional(),
    saveDataSuccessExecution: z.enum(["DEFAULT", "all", "none"]).optional(),
    saveManualExecutions: z.union([z.literal("DEFAULT"), z.boolean()]).optional(),
    saveExecutionProgress: z
      .union([z.literal("DEFAULT"), z.boolean()])
      .optional(),
    executionTimeout: z.number().optional(),
    executionOrder: z.enum(["v0", "v1"]).optional(),
  })
  .passthrough()
  .optional();

export const n8nWorkflowSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    active: z.boolean(),
    nodes: z.array(nodeSchema),
    connections: z.record(z.string(), z.record(z.string(), z.array(z.array(connectionSchema)))),
    settings: settingsSchema,
    pinData: z.record(z.string(), z.unknown()).optional(),
    versionId: z.string().optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
    tags: z
      .array(z.object({ id: z.string(), name: z.string() }).passthrough())
      .optional(),
  })
  .passthrough();

export type ParsedWorkflow = z.infer<typeof n8nWorkflowSchema>;
