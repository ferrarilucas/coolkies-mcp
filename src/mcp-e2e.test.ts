import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { serve } from "@hono/node-server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { app } from "./app";

let server: ReturnType<typeof serve>;
let baseUrl: string;
const realFetch = globalThis.fetch;

beforeAll(async () => {
  process.env.COOLKIES_BASE_URL = "http://coolkies.test";
  await new Promise<void>((resolve) => {
    server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      baseUrl = `http://localhost:${info.port}`;
      resolve();
    });
  });
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/mcp end-to-end", () => {
  it("chama list_workspaces autenticado e recebe a resposta encaminhada pela API do coolkies-system", async () => {
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.startsWith("http://coolkies.test")) {
        return new Response(
          JSON.stringify({ workspaces: [{ id: "w1", name: "Loja", slug: "loja", role: "OWNER", active: true }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return realFetch(input, init);
    });

    const client = new Client({ name: "test-client", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`), {
      requestInit: { headers: { Authorization: "Bearer test-token" } },
    });
    await client.connect(transport);

    const result = await client.callTool({ name: "list_workspaces", arguments: {} });

    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(JSON.parse(text)).toEqual({
      workspaces: [{ id: "w1", name: "Loja", slug: "loja", role: "OWNER", active: true }],
    });

    await client.close();
  });

  it("recusa a conexão quando não há Authorization", async () => {
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));

    await expect(client.connect(transport)).rejects.toThrow();
  });
});
