import { afterEach, describe, expect, it, vi } from "vitest";
import { createSaleHandler, listSalesHandler, markSalesAsPaidHandler } from "./sales";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listSalesHandler", () => {
  it("monta a query string a partir dos filtros informados", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      return new Response(JSON.stringify({ sales: [], summary: {} }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listSalesHandler("tok", { status: "PENDING", customerId: "c1" });

    expect(result.isError).toBeFalsy();
    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toContain("status=PENDING");
    expect(calledUrl).toContain("customerId=c1");
    expect(calledUrl).not.toContain("q=");
  });

  it("normaliza datas ISO completas para YYYY-MM-DD na query string", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      return new Response(JSON.stringify({ sales: [], summary: {} }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listSalesHandler("tok", {
      from: "2026-09-01T00:00:00Z",
      to: "2026-09-30T23:59:59.000Z",
      forecastFrom: "2026-09-05T10:30:00",
      forecastTo: "2026-09-10",
    });

    expect(result.isError).toBeFalsy();
    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toContain("from=2026-09-01");
    expect(calledUrl).toContain("to=2026-09-30");
    expect(calledUrl).toContain("forecastFrom=2026-09-05");
    expect(calledUrl).toContain("forecastTo=2026-09-10");
    expect(calledUrl).not.toContain("T00%3A00%3A00");
    expect(calledUrl).not.toContain("T23%3A59%3A59");
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

  it("normaliza soldAt e forecastDate ISO completos para YYYY-MM-DD", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      return new Response(JSON.stringify({ sale: { id: "s1", totalCents: 3000 } }), { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSaleHandler("tok", {
      customerName: "Cliente Avulso",
      soldAt: "2026-09-01T00:00:00Z",
      forecastDate: "2026-09-15T10:30:00",
      status: "PENDING",
      items: [{ itemId: "i1", productName: "Bolo", quantity: 2, unitPriceCents: 1500 }],
    });

    expect(result.isError).toBeFalsy();
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.soldAt).toBe("2026-09-01");
    expect(body.forecastDate).toBe("2026-09-15");
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
