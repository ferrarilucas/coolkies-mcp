import { Hono } from "hono";
import { cors } from "hono/cors";

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
