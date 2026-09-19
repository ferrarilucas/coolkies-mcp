import { afterEach, describe, expect, it, vi } from "vitest";
import { readEnvOrDefault } from "./env.js";

afterEach(() => {
  delete process.env.SOME_TEST_VAR;
  vi.restoreAllMocks();
});

describe("readEnvOrDefault", () => {
  it("retorna o valor configurado quando presente", () => {
    process.env.SOME_TEST_VAR = "http://configurado.test";
    expect(readEnvOrDefault("SOME_TEST_VAR", "http://fallback.test")).toBe("http://configurado.test");
  });

  it("retorna o fallback e avisa no console quando a variável não está configurada", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = readEnvOrDefault("SOME_TEST_VAR", "http://fallback.test");

    expect(result).toBe("http://fallback.test");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain("SOME_TEST_VAR");
  });
});
