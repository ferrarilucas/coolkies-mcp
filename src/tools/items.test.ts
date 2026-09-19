import { afterEach, describe, expect, it, vi } from "vitest";
import { createItemHandler, listItemsHandler } from "./items.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listItemsHandler", () => {
  it("repassa a lista de itens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ items: [{ id: "i1", name: "Açúcar" }] }), { status: 200 })),
    );

    const result = await listItemsHandler("tok");

    expect(result.isError).toBeFalsy();
    expect(JSON.parse((result.content[0] as { text: string }).text).items).toHaveLength(1);
  });
});

describe("createItemHandler", () => {
  it("envia POST com os campos do item", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("/api/v1/items");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        name: "Refrigerante",
        unit: "UN",
        sellable: true,
        productionInput: false,
      });
      return new Response(JSON.stringify({ item: { id: "i2" } }), { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createItemHandler("tok", {
      name: "Refrigerante",
      unit: "UN",
      sellable: true,
      productionInput: false,
    });

    expect(result.isError).toBeFalsy();
  });

  it("retorna isError quando a API recusa (ex: sem papel OWNER/ADMIN)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Não autorizado." }), { status: 403 })),
    );

    const result = await createItemHandler("tok", {
      name: "Item",
      unit: "UN",
      sellable: true,
      productionInput: false,
    });

    expect(result.isError).toBe(true);
  });
});
