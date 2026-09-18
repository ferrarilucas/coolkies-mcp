import { serve } from "@hono/node-server";
import { app } from "./app";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3100;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`coolkies-mcp ouvindo em http://localhost:${info.port}`);
});
