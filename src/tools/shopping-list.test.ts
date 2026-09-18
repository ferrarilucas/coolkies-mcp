import { afterEach, describe, expect, it, vi } from "vitest";
import { addShoppingListItemHandler, listShoppingListItemsHandler } from "./shopping-list";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listShoppingListItemsHandler", () => {
  it("repassa a lista de itens pendentes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ items: [{ id: "s1", label: "Farinha" }] }), { status: 200 })),
    );

    const result = await listShoppingListItemsHandler("tok");

    expect(result.isError).toBeFalsy();
    expect(JSON.parse((result.content[0] as { text: string }).text).items).toHaveLength(1);
  });
});

describe("addShoppingListItemHandler", () => {
  it("envia POST com a descrição do item", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("/api/v1/shopping-list");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({ label: "Ovos", quantity: 30, unit: "UN" });
      return new Response(JSON.stringify({ item: { id: "s2" } }), { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await addShoppingListItemHandler("tok", { label: "Ovos", quantity: 30, unit: "UN" });

    expect(result.isError).toBeFalsy();
  });
});
