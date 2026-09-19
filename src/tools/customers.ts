import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { callCoolkiesApi } from "../lib/coolkies-client.js";
import { toolError, toolJson } from "../lib/tool-result.js";
import { requireToken } from "./auth.js";

export async function listCustomersHandler(token: string, args: { q?: string }): Promise<CallToolResult> {
  try {
    const query = args.q ? `?q=${encodeURIComponent(args.q)}` : "";
    const data = await callCoolkiesApi(token, `/api/v1/customers${query}`);
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export type CreateCustomerArgs = {
  name: string;
  email?: string;
  phone?: string;
  sector?: string;
  notes?: string;
};

export async function createCustomerHandler(token: string, args: CreateCustomerArgs): Promise<CallToolResult> {
  try {
    const data = await callCoolkiesApi(token, "/api/v1/customers", { method: "POST", body: args });
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export function registerCustomerTools(server: McpServer): void {
  server.registerTool(
    "list_customers",
    {
      title: "Buscar clientes",
      description:
        "Busca clientes do workspace ativo por nome, telefone ou e-mail. Sem filtro, lista os mais recentes.",
      inputSchema: { q: z.string().optional().describe("Termo de busca: nome, telefone ou e-mail") },
    },
    async (args, extra) => listCustomersHandler(requireToken(extra), args),
  );

  server.registerTool(
    "create_customer",
    {
      title: "Criar cliente",
      description: "Cria um cliente novo no workspace ativo.",
      inputSchema: {
        name: z.string().describe("Nome do cliente"),
        email: z.string().optional().describe("E-mail (opcional)"),
        phone: z.string().optional().describe("Telefone (opcional)"),
        sector: z.string().optional().describe("Setor/categoria (opcional)"),
        notes: z.string().optional().describe("Observações (opcional)"),
      },
    },
    async (args, extra) => createCustomerHandler(requireToken(extra), args),
  );
}
