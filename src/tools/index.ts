import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWorkspaceTools } from "./workspaces";
import { registerItemTools } from "./items";
import { registerShoppingListTools } from "./shopping-list";

export function registerTools(server: McpServer): void {
  registerWorkspaceTools(server);
  registerItemTools(server);
  registerShoppingListTools(server);
}
