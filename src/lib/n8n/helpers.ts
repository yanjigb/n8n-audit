import type {
  N8nWorkflow,
  N8nNode,
  N8nConnection,
} from "@/types/n8n";

export interface WorkflowHelpers {
  getNodeById(id: string): N8nNode | undefined;
  getNodeByName(name: string): N8nNode | undefined;
  getNodesByType(typeFragment: string): N8nNode[];
  getOutgoingConnections(nodeName: string): N8nConnection[];
  getIncomingConnections(
    nodeName: string
  ): Array<{ fromNode: string; connection: N8nConnection }>;
  hasErrorOutput(nodeName: string): boolean;
  getTerminalNodes(): N8nNode[];
  getOrphanNodes(): N8nNode[];
  getTriggerNodes(): N8nNode[];
  getDepth(nodeName: string): number;
  getAllParameterValues(node: N8nNode): string[];
  stringifyParameters(node: N8nNode): string;
  adjacencyMap: Map<string, string[]>;
  nodeMap: Map<string, N8nNode>;
  connectionCount: number;
}

export function buildHelpers(workflow: N8nWorkflow): WorkflowHelpers {
  const nodeMap = new Map<string, N8nNode>();
  const nodeIdMap = new Map<string, N8nNode>();
  for (const node of workflow.nodes) {
    nodeMap.set(node.name, node);
    nodeIdMap.set(node.id, node);
  }

  const adjacencyMap = new Map<string, string[]>();
  let connectionCount = 0;

  const incomingMap = new Map<
    string,
    Array<{ fromNode: string; connection: N8nConnection }>
  >();

  for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
    for (const outputType of Object.values(outputs)) {
      for (const connectionGroup of outputType) {
        for (const conn of connectionGroup) {
          connectionCount++;
          const targets = adjacencyMap.get(sourceName) ?? [];
          targets.push(conn.node);
          adjacencyMap.set(sourceName, targets);

          const incoming = incomingMap.get(conn.node) ?? [];
          incoming.push({ fromNode: sourceName, connection: conn });
          incomingMap.set(conn.node, incoming);
        }
      }
    }
  }

  const depthCache = new Map<string, number>();

  function computeDepths() {
    if (depthCache.size > 0) return;
    const triggers = workflow.nodes.filter((n) =>
      n.type.toLowerCase().includes("trigger")
    );
    const queue: Array<{ name: string; depth: number }> = triggers.map(
      (t) => ({ name: t.name, depth: 0 })
    );
    while (queue.length > 0) {
      const { name, depth } = queue.shift()!;
      if (depthCache.has(name)) continue;
      depthCache.set(name, depth);
      const neighbors = adjacencyMap.get(name) ?? [];
      for (const n of neighbors) {
        if (!depthCache.has(n)) {
          queue.push({ name: n, depth: depth + 1 });
        }
      }
    }
    // Nodes not reachable from triggers
    for (const node of workflow.nodes) {
      if (!depthCache.has(node.name)) {
        depthCache.set(node.name, -1);
      }
    }
  }

  function extractValues(obj: unknown): string[] {
    const values: string[] = [];
    if (typeof obj === "string") {
      values.push(obj);
    } else if (Array.isArray(obj)) {
      for (const item of obj) values.push(...extractValues(item));
    } else if (obj && typeof obj === "object") {
      for (const val of Object.values(obj)) values.push(...extractValues(val));
    }
    return values;
  }

  return {
    nodeMap,
    adjacencyMap,
    connectionCount,

    getNodeById(id) {
      return nodeIdMap.get(id);
    },

    getNodeByName(name) {
      return nodeMap.get(name);
    },

    getNodesByType(typeFragment) {
      return workflow.nodes.filter((n) =>
        n.type.toLowerCase().includes(typeFragment.toLowerCase())
      );
    },

    getOutgoingConnections(nodeName) {
      const outputs = workflow.connections[nodeName];
      if (!outputs) return [];
      const result: N8nConnection[] = [];
      for (const outputType of Object.values(outputs)) {
        for (const group of outputType) {
          result.push(...group);
        }
      }
      return result;
    },

    getIncomingConnections(nodeName) {
      return incomingMap.get(nodeName) ?? [];
    },

    hasErrorOutput(nodeName) {
      const outputs = workflow.connections[nodeName];
      if (!outputs) return false;
      // Error outputs are typically at index 1 of "main" or under a separate key
      const main = outputs["main"];
      if (main && main.length > 1 && main[1] && main[1].length > 0) {
        return true;
      }
      return false;
    },

    getTerminalNodes() {
      return workflow.nodes.filter((n) => {
        const conns = adjacencyMap.get(n.name);
        return !conns || conns.length === 0;
      });
    },

    getOrphanNodes() {
      return workflow.nodes.filter((n) => {
        const hasOutgoing = adjacencyMap.has(n.name);
        const hasIncoming = incomingMap.has(n.name);
        const isTrigger = n.type.toLowerCase().includes("trigger");
        return !hasOutgoing && !hasIncoming && !isTrigger;
      });
    },

    getTriggerNodes() {
      return workflow.nodes.filter((n) =>
        n.type.toLowerCase().includes("trigger")
      );
    },

    getDepth(nodeName) {
      computeDepths();
      return depthCache.get(nodeName) ?? -1;
    },

    getAllParameterValues(node) {
      return extractValues(node.parameters);
    },

    stringifyParameters(node) {
      return JSON.stringify(node.parameters);
    },
  };
}

