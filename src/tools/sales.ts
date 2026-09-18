import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { callCoolkiesApi } from "../lib/coolkies-client";
import { toolError, toolJson } from "../lib/tool-result";
import { requireToken } from "./auth";

export type ListSalesArgs = {
  status?: "PAID" | "PENDING";
  q?: string;
  customerId?: string;
  from?: string;
  to?: string;
  forecastFrom?: string;
  forecastTo?: string;
  overdueOnly?: boolean;
};

const DATE_ONLY_FIELDS = ["from", "to", "forecastFrom", "forecastTo"] as const;

function normalizeDateOnly(value: string): string {
  return value.slice(0, 10);
}

export async function listSalesHandler(token: string, args: ListSalesArgs): Promise<CallToolResult> {
  try {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(args)) {
      if (value === undefined) continue;
      const isDateOnlyField = (DATE_ONLY_FIELDS as readonly string[]).includes(key);
      params.set(key, isDateOnlyField ? normalizeDateOnly(String(value)) : String(value));
    }
    const query = params.size > 0 ? `?${params.toString()}` : "";
    const data = await callCoolkiesApi(token, `/api/v1/sales${query}`);
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export type CreateSaleArgs = {
  customerId?: string;
  customerName?: string;
  soldAt?: string;
  notes?: string;
  status?: "PAID" | "PENDING";
  forecastDate?: string;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  items: Array<{
    itemId: string;
    productName: string;
    variantId?: string;
    flavorName?: string;
    quantity: number;
    unitPriceCents: number;
  }>;
};

export async function createSaleHandler(token: string, args: CreateSaleArgs): Promise<CallToolResult> {
  try {
    const body = {
      ...args,
      ...(args.soldAt !== undefined ? { soldAt: normalizeDateOnly(args.soldAt) } : {}),
      ...(args.forecastDate !== undefined ? { forecastDate: normalizeDateOnly(args.forecastDate) } : {}),
    };
    const data = await callCoolkiesApi(token, "/api/v1/sales", { method: "POST", body });
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export type MarkSalesAsPaidArgs = {
  saleId?: string;
  saleIds?: string[];
  customerId?: string;
};

export async function markSalesAsPaidHandler(token: string, args: MarkSalesAsPaidArgs): Promise<CallToolResult> {
  try {
    const data = await callCoolkiesApi(token, "/api/v1/sales/mark-paid", { method: "POST", body: args });
    return toolJson(data);
  } catch (e) {
    return toolError(e);
  }
}

export function registerSalesTools(server: McpServer): void {
  server.registerTool(
    "list_sales",
    {
      title: "Listar vendas",
      description:
        "Lista vendas do workspace ativo com os mesmos filtros da tela de vendas, e retorna um resumo (total pendente, total vencido). Use customerId + status: PENDING para saber quanto um cliente deve.",
      inputSchema: {
        status: z.enum(["PAID", "PENDING"]).optional(),
        q: z.string().optional().describe("Busca livre por nome do cliente, setor, observações ou produto"),
        customerId: z.string().optional(),
        from: z.string().optional().describe("Data inicial da venda, no formato YYYY-MM-DD"),
        to: z.string().optional().describe("Data final da venda, no formato YYYY-MM-DD"),
        forecastFrom: z.string().optional().describe("Previsão de pagamento inicial, no formato YYYY-MM-DD"),
        forecastTo: z.string().optional().describe("Previsão de pagamento final, no formato YYYY-MM-DD"),
        overdueOnly: z.boolean().optional().describe("Só vendas pendentes vencidas"),
      },
    },
    async (args, extra) => listSalesHandler(requireToken(extra), args),
  );

  server.registerTool(
    "create_sale",
    {
      title: "Registrar venda",
      description: "Registra uma venda com um ou mais itens já inclusos.",
      inputSchema: {
        customerId: z.string().optional(),
        customerName: z.string().optional(),
        soldAt: z.string().optional().describe("Data da venda no formato YYYY-MM-DD, padrão agora"),
        notes: z.string().optional(),
        status: z.enum(["PAID", "PENDING"]).optional().describe("Padrão PAID"),
        forecastDate: z
          .string()
          .optional()
          .describe("Previsão de pagamento no formato YYYY-MM-DD, só para PENDING"),
        discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
        discountValue: z.number().optional(),
        items: z
          .array(
            z.object({
              itemId: z.string(),
              productName: z.string(),
              variantId: z.string().optional(),
              flavorName: z.string().optional(),
              quantity: z.number(),
              unitPriceCents: z.number(),
            }),
          )
          .min(1),
      },
    },
    async (args, extra) => createSaleHandler(requireToken(extra), args),
  );

  server.registerTool(
    "mark_sales_as_paid",
    {
      title: "Marcar vendas como pagas",
      description: "Marca uma venda, uma lista de vendas, ou todas as vendas pendentes de um cliente como pagas.",
      inputSchema: {
        saleId: z.string().optional(),
        saleIds: z.array(z.string()).optional(),
        customerId: z.string().optional(),
      },
    },
    async (args, extra) => markSalesAsPaidHandler(requireToken(extra), args),
  );
}
