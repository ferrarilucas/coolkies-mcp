import { describe, expect, it } from "vitest";
import { toolError, toolJson } from "./tool-result";
import { CoolkiesApiError } from "./coolkies-client";

describe("toolJson", () => {
  it("serializa o valor em um bloco de texto", () => {
    const result = toolJson({ a: 1 });
    expect(result.content).toEqual([{ type: "text", text: JSON.stringify({ a: 1 }, null, 2) }]);
    expect(result.isError).toBeUndefined();
  });
});

describe("toolError", () => {
  it("usa a mensagem de um CoolkiesApiError e marca isError", () => {
    const result = toolError(new CoolkiesApiError(404, "Venda não encontrada."));
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "Venda não encontrada." }]);
  });

  it("usa uma mensagem genérica para erros desconhecidos", () => {
    const result = toolError("algo estranho");
    expect(result.content).toEqual([{ type: "text", text: "Erro inesperado." }]);
  });
});
