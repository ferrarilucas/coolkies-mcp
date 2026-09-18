import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CoolkiesApiError } from "./coolkies-client";

export function toolJson(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function toolError(e: unknown): CallToolResult {
  const message =
    e instanceof CoolkiesApiError ? e.message : e instanceof Error ? e.message : "Erro inesperado.";
  return { content: [{ type: "text", text: message }], isError: true };
}
