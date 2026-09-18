import { afterEach, describe, expect, it, vi } from "vitest";
import { createSaleHandler, listSalesHandler, markSalesAsPaidHandler } from "./sales";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listSalesHandler", () => {
  it("monta a query string a partir dos filtros informados", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("status=PENDING");
      expect(url).toContain("customerId=c1");
      expect(url).not.toContain("q=");
      return new Response(JSON.stringify({ sales: [], summary: {} }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await listSalesHandler("tok", { status: "PENDING", customerId: "c1" });
  });
});

describe("createSaleHandler", () => {
  it("envia POST com os itens da venda", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("/api/v1/sales");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body));
      expect(body.items).toHaveLength(1);
      return new Response(JSON.stringify({ sale: { id: "s1", totalCents: 3000 } }), { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSaleHandler("tok", {
      customerName: "Cliente Avulso",
      items: [{ itemId: "i1", productName: "Bolo", quantity: 2, unitPriceCents: 1500 }],
    });

    expect(result.isError).toBeFalsy();
  });
});

describe("markSalesAsPaidHandler", () => {
  it("envia POST com customerId", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("/api/v1/sales/mark-paid");
      expect(JSON.parse(String(init?.body))).toEqual({ customerId: "c1" });
      return new Response(JSON.stringify({ count: 2, totalCents: 5000 }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await markSalesAsPaidHandler("tok", { customerId: "c1" });

    expect(result.isError).toBeFalsy();
  });
});
