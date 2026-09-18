import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { callCoolkiesApi } from "../lib/coolkies-client";
import { toolError, toolJson } from "../lib/tool-result";
import { requireToken } from "./auth";

export async function listWorkspacesHandler(token: string): Promise<CallToolResult> {
  try {
    const data = await callCoolkiesApi(token, "/api/v1/workspaces");
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export async function setActiveWorkspaceHandler(
  token: string,
  args: { workspaceId: string },
): Promise<CallToolResult> {
  try {
    const data = await callCoolkiesApi(token, "/api/v1/workspaces/active", {
      method: "PUT",
      body: { workspaceId: args.workspaceId },
    });
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export function registerWorkspaceTools(server: McpServer): void {
  server.registerTool(
    "list_workspaces",
    {
      title: "Listar workspaces",
      description: "Lista os workspaces do usuário logado, com o papel em cada um e qual está ativo.",
    },
    async (extra) => listWorkspacesHandler(requireToken(extra)),
  );

  server.registerTool(
    "set_active_workspace",
    {
      title: "Trocar workspace ativo",
      description: "Define qual workspace fica ativo para as próximas chamadas de outras tools.",
      inputSchema: { workspaceId: z.string().describe("ID do workspace (retornado por list_workspaces)") },
    },
    async ({ workspaceId }, extra) => setActiveWorkspaceHandler(requireToken(extra), { workspaceId }),
  );
}
