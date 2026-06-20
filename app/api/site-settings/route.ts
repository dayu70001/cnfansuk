import { NextResponse } from "next/server";
import { readSiteSettings, sanitizeSiteSettings, writeSiteSettings } from "@/lib/siteSettings";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "未登录" }, { status: 401 });

  return NextResponse.json(readSiteSettings());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const settings = sanitizeSiteSettings(await request.json());
    return NextResponse.json(writeSiteSettings(settings));
  } catch {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }
}
