import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
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

// Static pages in public/<dir>/index.html (story, deck, judge) open as themselves, not as the app.
// "/story" redirects to "/story/" so their relative asset paths resolve. Vercel serves them the same way.
function staticDirIndex(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const path = (req.url ?? "").split("?")[0];
    const m = path.match(/^\/([a-z0-9-]+)(\/?)$/);
    if (!m || !existsSync(resolve("public", m[1], "index.html"))) return next();
    if (!m[2]) {
      res.statusCode = 301;
      res.setHeader("Location", `/${m[1]}/`);
      res.end();
      return;
    }
    req.url = `/${m[1]}/index.html`;
    next();
  };
  return {
    name: "static-dir-index",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return { plugins: [react(), staticDirIndex(), devApi()] };
});
