import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAdminWorkerToken, isAdminAuthenticated } from "@/lib/adminAuth";
import { fetchSiteSettings, sanitizeSiteSettings, SITE_SETTINGS_CACHE_TAG } from "@/lib/siteSettings";
import { getCatalogApiBase } from "@/lib/catalogApiBase";

function workerBaseUrl() {
  return getCatalogApiBase();
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  return NextResponse.json(await fetchSiteSettings());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const baseUrl = workerBaseUrl();
  const token = getAdminWorkerToken();
  if (!baseUrl || !token) return NextResponse.json({ error: "后台服务环境变量尚未配置。" }, { status: 503 });
  try {
    const settings = sanitizeSiteSettings(await request.json());
    const response = await fetch(`${baseUrl}/admin/site-settings`, {
      method: "PUT",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(settings),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({})) as { settings?: unknown; error?: string };
    if (!response.ok || !result.settings) return NextResponse.json({ error: result.error || "设置保存失败。" }, { status: response.status || 500 });
    const nextSettings = sanitizeSiteSettings(result.settings);

    // The Worker write succeeds before this route returns. Invalidate the
    // tagged settings fetch and the cached homepage/layout so the next
    // storefront request renders the newly saved values immediately instead
    // of waiting for the previous one-hour ISR window.
    revalidateTag(SITE_SETTINGS_CACHE_TAG, { expire: 0 });
    revalidatePath("/", "page");
    revalidatePath("/", "layout");

    return NextResponse.json(nextSettings);
  } catch {
    return NextResponse.json({ error: "首页设置数据无效。" }, { status: 400 });
  }
}
