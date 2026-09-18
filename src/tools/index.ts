import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWorkspaceTools } from "./workspaces";
import { registerItemTools } from "./items";

export function registerTools(server: McpServer): void {
  registerWorkspaceTools(server);
  registerItemTools(server);
}
