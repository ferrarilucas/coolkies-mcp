import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWorkspaceTools } from "./workspaces";

export function registerTools(server: McpServer): void {
  registerWorkspaceTools(server);
}
