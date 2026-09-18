import { afterEach, describe, expect, it, vi } from "vitest";
import { createCustomerHandler, listCustomersHandler } from "./customers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listCustomersHandler", () => {
  it("inclui o termo de busca na query string", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("/api/v1/customers?q=maria");
      return new Response(JSON.stringify({ customers: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await listCustomersHandler("tok", { q: "maria" });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sem termo de busca não inclui query string", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("/api/v1/customers");
      expect(url).not.toContain("?");
      return new Response(JSON.stringify({ customers: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await listCustomersHandler("tok", {});
  });
});

describe("createCustomerHandler", () => {
  it("envia POST com os campos do cliente", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("/api/v1/customers");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({ name: "Nova Cliente", email: "nova@example.com" });
      return new Response(JSON.stringify({ customer: { id: "c1" } }), { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createCustomerHandler("tok", { name: "Nova Cliente", email: "nova@example.com" });

    expect(result.isError).toBeFalsy();
  });
});
