import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const statePath = join(__dirname, "data", "state.json");
const port = Number(process.env.PORT || 5071);
const host = "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

async function readState() {
  if (!existsSync(statePath)) {
    return {};
  }
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function writeState(state) {
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(text);
}

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(/^([.][.][/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const data = await readFile(filePath);
    const contentType = contentTypes[extname(filePath)] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    sendText(response, 404, "Not found");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);

  if (url.pathname === "/api/state" && request.method === "GET") {
    try {
      sendJson(response, 200, await readState());
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : "Could not read state" });
    }
    return;
  }

  if (url.pathname === "/api/state" && request.method === "POST") {
    try {
      const state = JSON.parse(await readBody(request));
      sendJson(response, 200, await writeState(state));
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Invalid state payload" });
    }
    return;
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    try {
      const startedAt = Date.now();
      const upstream = await fetch("https://api.cnfans.co.uk/health", { method: "GET" });
      const body = await upstream.text();
      sendJson(response, 200, {
        ok: upstream.ok,
        status: upstream.status,
        elapsedMs: Date.now() - startedAt,
        body: body.slice(0, 500),
      });
    } catch (error) {
      sendJson(response, 200, {
        ok: false,
        status: 0,
        elapsedMs: null,
        error: error instanceof Error ? error.message : "Health check failed",
      });
    }
    return;
  }

  await serveStatic(request, response, url.pathname);
});

server.listen(port, host, () => {
  console.log(`CNFans UK Catalog Panel running at http://${host}:${port}`);
  console.log("Mode: Local Draft Only — no D1 writes, no R2 uploads, no real collection.");
});
