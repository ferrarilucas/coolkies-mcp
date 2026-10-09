import { afterEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createSaleHandler, listSalesHandler, markSalesAsPaidHandler, registerSalesTools } from "./sales.js";

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

function lastRequestBody(): unknown {
  const calls = vi.mocked(globalThis.fetch).mock.calls;
  return JSON.parse(String(calls.at(-1)?.[1]?.body));
}

describe("parcelamento", () => {
  it("create_sale envia parcelamento e normaliza a data da 1ª parcela", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ sale: { id: "s1" } }), { status: 201 })),
    );

    await createSaleHandler("tok", {
      installments: 3,
      forecastPreset: "CUSTOM",
      forecastDate: "2026-10-20T00:00:00.000Z",
      items: [{ itemId: "i1", productName: "Bolo", quantity: 1, unitPriceCents: 10000 }],
    });

    expect(lastRequestBody()).toMatchObject({ installments: 3, forecastPreset: "CUSTOM", forecastDate: "2026-10-20" });
  });

  it("mark_sales_as_paid repassa installmentIds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ count: 2, totalCents: 5000 }), { status: 200 })),
    );

    await markSalesAsPaidHandler("tok", { installmentIds: ["p1", "p2"] });

    expect(lastRequestBody()).toEqual({ installmentIds: ["p1", "p2"] });
  });
});

async function connectSalesTools(): Promise<Client> {
  const server = new McpServer({ name: "test-server", version: "1.0.0" });
  registerSalesTools(server);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const originalOnMessage = serverTransport.onmessage;
  serverTransport.onmessage = (message, extra) =>
    originalOnMessage?.(message, { ...extra, authInfo: { token: "tok", clientId: "test", scopes: [] } });
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

describe("schemas das tools de parcelamento", () => {
  it("create_sale aceita installments 3 com forecastPreset CUSTOM e repassa ao API", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ sale: { id: "s1" } }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = await connectSalesTools();

    const result = await client.callTool({
      name: "create_sale",
      arguments: {
        installments: 3,
        forecastPreset: "CUSTOM",
        forecastDate: "2026-10-20",
        items: [{ itemId: "i1", productName: "Bolo", quantity: 1, unitPriceCents: 10000 }],
      },
    });

    expect(result.isError).toBeFalsy();
    expect(lastRequestBody()).toMatchObject({ installments: 3, forecastPreset: "CUSTOM", forecastDate: "2026-10-20" });
    await client.close();
  });

  it.each([0, 25])("create_sale rejeita installments %i fora de 1..24", async (installments) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ sale: { id: "s1" } }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = await connectSalesTools();

    await expect(
      client.callTool({
        name: "create_sale",
        arguments: {
          installments,
          items: [{ itemId: "i1", productName: "Bolo", quantity: 1, unitPriceCents: 10000 }],
        },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(fetchMock).not.toHaveBeenCalled();
    await client.close();
  });

  it("create_sale rejeita forecastPreset fora do enum", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ sale: { id: "s1" } }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = await connectSalesTools();

    await expect(
      client.callTool({
        name: "create_sale",
        arguments: {
          installments: 2,
          forecastPreset: "BOGUS",
          items: [{ itemId: "i1", productName: "Bolo", quantity: 1, unitPriceCents: 10000 }],
        },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(fetchMock).not.toHaveBeenCalled();
    await client.close();
  });

  it("mark_sales_as_paid aceita installmentIds e repassa ao API", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ count: 1, totalCents: 5000 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = await connectSalesTools();

    const result = await client.callTool({ name: "mark_sales_as_paid", arguments: { installmentIds: ["p1"] } });

    expect(result.isError).toBeFalsy();
    expect(lastRequestBody()).toEqual({ installmentIds: ["p1"] });
    await client.close();
  });
});
