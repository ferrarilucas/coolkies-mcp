import { afterEach, describe, expect, it, vi } from "vitest";
import { callCoolkiesApi, CoolkiesApiError } from "./coolkies-client.js";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.COOLKIES_BASE_URL;
});

describe("callCoolkiesApi", () => {
  it("chama a URL certa com o Bearer token e retorna o JSON", async () => {
    process.env.COOLKIES_BASE_URL = "http://coolkies.test";
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("http://coolkies.test/api/v1/items");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer abc123");
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const data = await callCoolkiesApi("abc123", "/api/v1/items");
    expect(data).toEqual({ items: [] });
  });

  it("lança CoolkiesApiError com a mensagem do corpo quando a resposta não é ok", async () => {
    process.env.COOLKIES_BASE_URL = "http://coolkies.test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Nome obrigatório." }), { status: 400 })),
    );

    await expect(callCoolkiesApi("abc123", "/api/v1/items", { method: "POST", body: {} })).rejects.toThrow(
      "Nome obrigatório.",
    );
  });

  it("usa uma mensagem genérica quando o corpo do erro não tem campo error", async () => {
    process.env.COOLKIES_BASE_URL = "http://coolkies.test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));

    await expect(callCoolkiesApi("abc123", "/api/v1/items")).rejects.toThrow(CoolkiesApiError);
  });
});
