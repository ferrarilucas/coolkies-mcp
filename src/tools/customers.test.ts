import { afterEach, describe, expect, it, vi } from "vitest";
import { createCustomerHandler, listCustomersHandler } from "./customers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listCustomersHandler", () => {
  it("inclui o termo de busca na query string", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      return new Response(JSON.stringify({ customers: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listCustomersHandler("tok", { q: "maria" });

    expect(result.isError).toBeFalsy();
    expect(fetchMock).toHaveBeenCalledOnce();
    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toContain("/api/v1/customers?q=maria");
  });

  it("sem termo de busca não inclui query string", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      return new Response(JSON.stringify({ customers: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listCustomersHandler("tok", {});

    expect(result.isError).toBeFalsy();
    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toContain("/api/v1/customers");
    expect(calledUrl).not.toContain("?");
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
