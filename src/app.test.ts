import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("GET /health", () => {
  it("responde ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("GET /.well-known/oauth-protected-resource", () => {
  it("aponta o authorization server pro coolkies-system", async () => {
    process.env.COOLKIES_BASE_URL = "http://coolkies.test";
    process.env.MCP_PUBLIC_URL = "http://mcp.test";

    const res = await app.request("/.well-known/oauth-protected-resource");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      resource: "http://mcp.test",
      authorization_servers: ["http://coolkies.test"],
      bearer_methods_supported: ["header"],
    });
  });
});
