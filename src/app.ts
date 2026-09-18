import { Hono } from "hono";
import { cors } from "hono/cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { registerTools } from "./tools";

export const app = new Hono();

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
  const coolkiesBaseUrl = process.env.COOLKIES_BASE_URL ?? "http://localhost:3000";
  const mcpPublicUrl = process.env.MCP_PUBLIC_URL ?? "http://localhost:3100";
  return c.json({
    resource: mcpPublicUrl,
    authorization_servers: [coolkiesBaseUrl],
    bearer_methods_supported: ["header"],
  });
});

function unauthorizedResponse(): Response {
  const mcpPublicUrl = process.env.MCP_PUBLIC_URL ?? "http://localhost:3100";
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

  const authInfo: AuthInfo = { token, clientId: "coolkies-mcp-client", scopes: [] };
  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = createServer();
  await server.connect(transport);
  return transport.handleRequest(c.req.raw, { authInfo });
});
