import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWorkspaceTools } from "./workspaces";
import { registerItemTools } from "./items";
import { registerShoppingListTools } from "./shopping-list";
import { registerCustomerTools } from "./customers";
import { registerSalesTools } from "./sales";

export function registerTools(server: McpServer): void {
  registerWorkspaceTools(server);
  registerItemTools(server);
  registerShoppingListTools(server);
  registerCustomerTools(server);
  registerSalesTools(server);
}
