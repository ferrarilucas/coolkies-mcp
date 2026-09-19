import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CoolkiesApiError } from "./coolkies-client.js";

export function toolJson(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function toolError(e: unknown): CallToolResult {
  if (e instanceof CoolkiesApiError && e.status === 401) {
    return {
      content: [{ type: "text", text: `${e.message} Reconecte o conector do coolkies-mcp para renovar o acesso.` }],
      isError: true,
    };
  }
  const message =
    e instanceof CoolkiesApiError ? e.message : e instanceof Error ? e.message : "Erro inesperado.";
  return { content: [{ type: "text", text: message }], isError: true };
}
