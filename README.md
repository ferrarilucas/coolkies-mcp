# coolkies-mcp

Servidor MCP remoto do [Coolkies](https://github.com/ferrarilucas/coolkies-system) — conecte o Claude (ou qualquer cliente MCP) direto no seu workspace: consulte catálogo, clientes e vendas, adicione itens à lista de compras, registre vendas e marque pagamentos, tudo com o login que você já usa no Coolkies.

```
Claude Desktop / claude.ai  ──OAuth──►  coolkies-system (Authorization Server)
        │
        │  MCP · Streamable HTTP · Bearer token
        ▼
  coolkies-mcp (este repo)
        │
        │  HTTPS · /api/v1/*
        ▼
  coolkies-system (Resource Server)
```

Este servidor não guarda nenhum dado e não fala com banco nenhum. Cada chamada de tool é traduzida para uma requisição HTTP autenticada contra a API do [coolkies-system](https://github.com/ferrarilucas/coolkies-system) — o mesmo app onde você já cria workspaces, cadastra clientes e registra vendas.

## Como funciona a autenticação

O login não é deste repositório — é do coolkies-system, que atua como Authorization Server OAuth 2.1 (via [better-auth](https://better-auth.com)). Quando um cliente MCP (Claude Desktop, claude.ai) se conecta:

1. Ele bate em `/mcp` sem token, recebe `401` com um cabeçalho `WWW-Authenticate` apontando para `/.well-known/oauth-protected-resource`.
2. Esse endpoint informa que o Authorization Server é o coolkies-system.
3. O cliente faz o fluxo OAuth padrão (registro dinâmico + login pelo navegador) direto no coolkies-system — você entra com a conta que já usa no app.
4. Com o token em mãos, o cliente volta a chamar `/mcp`, e cada tool repassa esse token para a API do coolkies-system.

Nenhuma credencial passa por este servidor além do token Bearer, que é só encaminhado — nunca armazenado.

## Tools disponíveis

Todas as tools operam sobre o **workspace ativo** do usuário — nenhuma pede `workspaceId` como parâmetro. Troque de workspace com `set_active_workspace` quando precisar.

| Tool | O que faz |
|---|---|
| `list_workspaces` | Lista os workspaces do usuário, com o papel em cada um e qual está ativo |
| `set_active_workspace` | Troca o workspace ativo para as próximas chamadas |
| `list_items` | Lista o catálogo do workspace ativo |
| `create_item` | Cria um item no catálogo (requer papel OWNER ou ADMIN) |
| `list_shopping_list_items` | Lista os itens pendentes na lista de compras |
| `add_shopping_list_item` | Adiciona um item à lista de compras |
| `list_customers` | Busca clientes por nome, telefone ou e-mail |
| `create_customer` | Cria um cliente novo |
| `list_sales` | Lista vendas com os mesmos filtros da tela de vendas (status, período, cliente, vencidas...) e devolve um resumo — ideal para perguntar "quanto o cliente X me deve" |
| `create_sale` | Registra uma venda com um ou mais itens |
| `mark_sales_as_paid` | Marca uma venda, uma lista de vendas ou todas as pendentes de um cliente como pagas |

## Desenvolvimento local

Pré-requisitos: Node 20+, [pnpm](https://pnpm.io), e o [coolkies-system](https://github.com/ferrarilucas/coolkies-system) rodando localmente (ou apontando pra uma instância já no ar).

```bash
pnpm install
cp .env.example .env
pnpm dev
```

O servidor sobe em `http://localhost:3100` (porta configurável via `PORT`). Endpoints:

- `GET /health` — healthcheck
- `GET /.well-known/oauth-protected-resource` — metadata OAuth
- `ALL /mcp` — endpoint MCP (Streamable HTTP)

### Variáveis de ambiente

| Variável | Descrição | Padrão local |
|---|---|---|
| `COOLKIES_BASE_URL` | URL do coolkies-system (Authorization Server + API) | `http://localhost:3000` |
| `MCP_PUBLIC_URL` | URL pública deste servidor (usada na metadata OAuth) | `http://localhost:3100` |
| `PORT` | Porta do servidor local | `3100` |

Em produção, configure `COOLKIES_BASE_URL` e `MCP_PUBLIC_URL` com as URLs reais — sem elas o servidor cai num fallback local só pra não quebrar em dev, e avisa no console quando isso acontece.

### Testes

```bash
pnpm test          # roda tudo uma vez
pnpm test:watch    # modo watch
pnpm build         # compila pra dist/ (e já serve como type-check)
pnpm start         # roda o build (node dist/src/index.js)
```

Os testes não sobem um coolkies-system de verdade — o `fetch` é mockado em cada teste. A única exceção é `src/mcp-e2e.test.ts`, que sobe este servidor local numa porta efêmera e usa o SDK oficial do MCP (`Client` + `StreamableHTTPClientTransport`) pra fazer uma chamada real de ponta a ponta contra ele.

## Deploy

Este repo já vem pronto pra Vercel (`vercel.json` reescreve `/mcp`, `/health` e `/.well-known/oauth-protected-resource` para a function em `api/index.ts`).

```bash
vercel deploy --prod
```

Configure `COOLKIES_BASE_URL` e `MCP_PUBLIC_URL` nas env vars do projeto na Vercel antes do primeiro deploy.

## Conectando no Claude

Depois do deploy, adicione `https://<seu-dominio>/mcp` como um connector MCP remoto no Claude Desktop ou claude.ai. Na primeira chamada, o cliente vai te redirecionar pro login do coolkies-system — depois disso, é só pedir pro Claude listar seus workspaces, consultar o catálogo ou registrar uma venda.

## Arquitetura

```
src/
├── app.ts              # app Hono: /health, /.well-known, /mcp
├── index.ts             # entrypoint local (@hono/node-server)
├── lib/
│   ├── coolkies-client.ts   # callCoolkiesApi — único ponto que fala com a API
│   ├── tool-result.ts       # toolJson / toolError
│   └── env.ts                # leitura de env vars com fallback + aviso
└── tools/
    ├── auth.ts              # requireToken — extrai o Bearer do contexto MCP
    ├── index.ts              # registra as 11 tools no McpServer
    ├── workspaces.ts
    ├── items.ts
    ├── shopping-list.ts
    ├── customers.ts
    └── sales.ts

api/index.ts             # entrypoint Vercel (hono/vercel)
```

Cada arquivo em `src/tools/` segue o mesmo formato: funções `xHandler(token, args)` puras (fáceis de testar com `fetch` mockado) mais uma `registerXTools(server)` que faz a cola com o SDK do MCP. A cada request em `/mcp`, um `McpServer` e um transporte novos são criados do zero — o servidor é completamente stateless, sem sessão nem cache entre chamadas.

## Projeto irmão

[coolkies-system](https://github.com/ferrarilucas/coolkies-system) — o app onde tudo realmente acontece: cadastro de clientes, catálogo, vendas, estoque e assinatura. Este servidor MCP é só uma porta de entrada alternativa pros mesmos dados.
