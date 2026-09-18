import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { callCoolkiesApi } from "../lib/coolkies-client";
import { toolError, toolJson } from "../lib/tool-result";
import { requireToken } from "./auth";

export async function listItemsHandler(token: string): Promise<CallToolResult> {
  try {
    const data = await callCoolkiesApi(token, "/api/v1/items");
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export type CreateItemArgs = {
  name: string;
  unit: "G" | "ML" | "UN";
  sellable: boolean;
  productionInput: boolean;
  minStock?: number;
};

export async function createItemHandler(token: string, args: CreateItemArgs): Promise<CallToolResult> {
  try {
    const data = await callCoolkiesApi(token, "/api/v1/items", { method: "POST", body: args });
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export function registerItemTools(server: McpServer): void {
  server.registerTool(
    "list_items",
    { title: "Listar catálogo", description: "Lista os itens do catálogo do workspace ativo." },
    async (extra) => listItemsHandler(requireToken(extra)),
  );

  server.registerTool(
    "create_item",
    {
      title: "Criar item no catálogo",
      description: "Cria um item novo no catálogo do workspace ativo. Requer papel OWNER ou ADMIN.",
      inputSchema: {
        name: z.string().describe("Nome do item"),
        unit: z.enum(["G", "ML", "UN"]).describe("Unidade base do item"),
        sellable: z.boolean().describe("Se o item pode ser vendido (exige unit = UN)"),
        productionInput: z.boolean().describe("Se o item pode ser usado como insumo de produção"),
        minStock: z.number().optional().describe("Estoque mínimo (opcional)"),
      },
    },
    async (args, extra) => createItemHandler(requireToken(extra), args),
  );
}
