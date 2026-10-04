import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Serves api/detect.ts at /api/detect during `npm run dev`, so no Vercel CLI is needed locally.
function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use("/api/detect", async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const mod = await server.ssrLoadModule("/api/detect.ts");
        const handler = mod[req.method ?? "GET"];
        if (!handler) {
          res.statusCode = 405;
          res.end();
          return;
        }
        const response: Response = await handler(
          new Request("http://localhost/api/detect", {
            method: req.method,
            headers: { "Content-Type": "application/json" },
            body: Buffer.concat(chunks),
          }),
        );
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return { plugins: [react(), devApi()] };
});
