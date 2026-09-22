import { Hono } from "hono";
import { cors } from "hono/cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { registerTools } from "./tools/index.js";
import { readEnvOrDefault } from "./lib/env.js";

export const app = new Hono();

app.use("*", async (c, next) => {
  const hasAuth = Boolean(c.req.header("authorization"));
  console.log(`[coolkies-mcp] -> ${c.req.method} ${c.req.path} auth=${hasAuth}`);
  await next();
  console.log(`[coolkies-mcp] <- ${c.req.method} ${c.req.path} status=${c.res.status}`);
});

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "mcp-session-id", "mcp-protocol-version"],
    exposeHeaders: ["mcp-session-id", "mcp-protocol-version", "www-authenticate"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/.well-known/oauth-protected-resource", (c) => {
  const coolkiesBaseUrl = readEnvOrDefault("COOLKIES_BASE_URL", "http://localhost:3000");
  const mcpPublicUrl = readEnvOrDefault("MCP_PUBLIC_URL", "http://localhost:3100");
  return c.json({
    resource: mcpPublicUrl,
    authorization_servers: [coolkiesBaseUrl],
    bearer_methods_supported: ["header"],
  });
});

function unauthorizedResponse(): Response {
  const mcpPublicUrl = readEnvOrDefault("MCP_PUBLIC_URL", "http://localhost:3100");
  return new Response(JSON.stringify({ error: "Unauthorized: token ausente." }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource_metadata="${mcpPublicUrl}/.well-known/oauth-protected-resource"`,
    },
  });
}

function createServer(): McpServer {
  const server = new McpServer({ name: "coolkies-mcp", version: "0.1.0" });
  registerTools(server);
  return server;
}

app.all("/mcp", async (c) => {
  const token = c.req.header("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return unauthorizedResponse();

  if (c.req.method === "POST") {
    const bodyText = await c.req.raw
      .clone()
      .text()
      .catch(() => "<falha ao ler corpo>");
    console.log(`[coolkies-mcp] corpo /mcp: ${bodyText.slice(0, 800)}`);
  }

  const authInfo: AuthInfo = { token, clientId: "coolkies-mcp-client", scopes: [] };
  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = createServer();
  await server.connect(transport);
  const response = await transport.handleRequest(c.req.raw, { authInfo });

  if (!response.ok) {
    const errorBody = await response
      .clone()
      .text()
      .catch(() => "<falha ao ler corpo>");
    console.log(`[coolkies-mcp] erro /mcp status=${response.status}: ${errorBody.slice(0, 800)}`);
  }

  return response;
});
