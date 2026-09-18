import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { callCoolkiesApi } from "../lib/coolkies-client";
import { toolError, toolJson } from "../lib/tool-result";
import { requireToken } from "./auth";

export async function listShoppingListItemsHandler(token: string): Promise<CallToolResult> {
  try {
    const data = await callCoolkiesApi(token, "/api/v1/shopping-list");
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export type AddShoppingListItemArgs = {
  label: string;
  itemId?: string;
  quantity?: number;
  unit?: "G" | "ML" | "UN";
};

export async function addShoppingListItemHandler(
  token: string,
  args: AddShoppingListItemArgs,
): Promise<CallToolResult> {
  try {
    const data = await callCoolkiesApi(token, "/api/v1/shopping-list", { method: "POST", body: args });
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export function registerShoppingListTools(server: McpServer): void {
  server.registerTool(
    "list_shopping_list_items",
    { title: "Listar lista de compras", description: "Lista os itens pendentes na lista de compras do workspace ativo." },
    async (extra) => listShoppingListItemsHandler(requireToken(extra)),
  );

  server.registerTool(
    "add_shopping_list_item",
    {
      title: "Adicionar item à lista de compras",
      description: "Adiciona um item à lista de compras do workspace ativo.",
      inputSchema: {
        label: z.string().describe("Descrição do item"),
        itemId: z.string().optional().describe("ID de um item do catálogo, se aplicável"),
        quantity: z.number().optional().describe("Quantidade desejada"),
        unit: z.enum(["G", "ML", "UN"]).optional().describe("Unidade da quantidade"),
      },
    },
    async (args, extra) => addShoppingListItemHandler(requireToken(extra), args),
  );
}
