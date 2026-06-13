import { NextResponse } from "next/server";
import { readSiteSettings, sanitizeSiteSettings, writeSiteSettings } from "@/lib/siteSettings";

function localAdminEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_LOCAL_HOMEPAGE_ADMIN === "true";
}

export async function GET() {
  if (!localAdminEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }

  return NextResponse.json(readSiteSettings());
}

export async function POST(request: Request) {
  if (!localAdminEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }

  try {
    const settings = sanitizeSiteSettings(await request.json());
    return NextResponse.json(writeSiteSettings(settings));
  } catch {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }
}
