import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWorkspaceTools } from "./workspaces.js";
import { registerItemTools } from "./items.js";
import { registerShoppingListTools } from "./shopping-list.js";
import { registerCustomerTools } from "./customers.js";
import { registerSalesTools } from "./sales.js";

export function registerTools(server: McpServer): void {
  registerWorkspaceTools(server);
  registerItemTools(server);
  registerShoppingListTools(server);
  registerCustomerTools(server);
  registerSalesTools(server);
}
