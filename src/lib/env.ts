export function readEnvOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  if (value) return value;
  console.warn(
    `[coolkies-mcp] Variável de ambiente ${name} não configurada. Usando valor padrão de desenvolvimento "${fallback}". Configure ${name} para evitar falhas de conexão ou de OAuth em produção.`,
  );
  return fallback;
}
