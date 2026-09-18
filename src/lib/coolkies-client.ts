import { readEnvOrDefault } from "./env";

export class CoolkiesApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "CoolkiesApiError";
  }
}

type CallOptions = {
  method?: string;
  body?: unknown;
};

export async function callCoolkiesApi(
  token: string,
  path: string,
  options: CallOptions = {},
): Promise<unknown> {
  const baseUrl = readEnvOrDefault("COOLKIES_BASE_URL", "http://localhost:3000");

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Erro ao chamar ${path} (HTTP ${response.status}).`;
    throw new CoolkiesApiError(response.status, message);
  }

  return data;
}
