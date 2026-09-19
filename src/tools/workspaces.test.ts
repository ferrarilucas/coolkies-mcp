import { afterEach, describe, expect, it, vi } from "vitest";
import { listWorkspacesHandler, setActiveWorkspaceHandler } from "./workspaces.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listWorkspacesHandler", () => {
  it("repassa a resposta da API do coolkies-system", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ workspaces: [{ id: "w1", name: "Loja", slug: "loja", role: "OWNER", active: true }] }),
          { status: 200 },
        ),
      ),
    );

    const result = await listWorkspacesHandler("tok");

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { text: string }).text;
    expect(JSON.parse(text).workspaces).toHaveLength(1);
  });

  it("retorna isError quando a API falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Token inválido." }), { status: 401 })),
    );

    const result = await listWorkspacesHandler("tok-invalido");

    expect(result.isError).toBe(true);
  });
});

describe("setActiveWorkspaceHandler", () => {
  it("envia PUT com o workspaceId no corpo", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("/api/v1/workspaces/active");
      expect(init?.method).toBe("PUT");
      expect(JSON.parse(String(init?.body))).toEqual({ workspaceId: "w2" });
      return new Response(JSON.stringify({ id: "w2", name: "Loja 2", slug: "loja-2", role: "MEMBER" }), {
        status: 200,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await setActiveWorkspaceHandler("tok", { workspaceId: "w2" });

    expect(result.isError).toBeFalsy();
  });
});
