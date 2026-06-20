import { NextResponse } from "next/server";
import { getAdminWorkerToken, isAdminAuthenticated } from "@/lib/adminAuth";

type RouteContext = { params: Promise<{ path: string[] }> };

function workerBaseUrl() {
  return (process.env.CATALOG_API_BASE || process.env.NEXT_PUBLIC_CATALOG_API_BASE || "").replace(/\/+$/, "");
}

async function proxyAdminRequest(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const secret = getAdminWorkerToken();
  const baseUrl = workerBaseUrl();
  if (!baseUrl || !secret) return NextResponse.json({ error: "后台服务环境变量尚未配置。" }, { status: 503 });

  const { path } = await context.params;
  if (!path.length || !["products", "orders"].includes(path[0])) {
    return NextResponse.json({ error: "接口不存在" }, { status: 404 });
  }
  const incomingUrl = new URL(request.url);
  const target = new URL(`${baseUrl}/admin/${path.map(encodeURIComponent).join("/")}`);
  target.search = incomingUrl.search;
  const body = request.method === "GET" ? undefined : await request.text();
  if (body && body.length > 64_000) return NextResponse.json({ error: "请求内容过大" }, { status: 413 });

  const response = await fetch(target, {
    method: request.method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secret}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body,
    cache: "no-store",
  });
  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  });
}

export async function GET(request: Request, context: RouteContext) {
  return proxyAdminRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxyAdminRequest(request, context);
}
