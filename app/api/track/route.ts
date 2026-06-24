import { NextRequest, NextResponse } from "next/server";

const TARGET_URL = "http://zxdexpress.com/logistic.html";

interface TrackEvent {
  date: string;
  location: string;
  content: string;
}

interface TrackResult {
  ok: boolean;
  trackingNumber?: string;
  destination?: string;
  latestStatus?: string;
  latestTime?: string;
  events?: TrackEvent[];
  error?: string;
}

function parseLogisticHtml(html: string): TrackResult {
  // Check if there are any results
  if (
    html.includes("暂无轨迹信息") ||
    html.includes("没有找到") ||
    html.includes("No tracking information")
  ) {
    return { ok: false, error: "No tracking information found." };
  }

  const pageContentMatch = html.match(/id="page-content"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  if (!pageContentMatch) {
    return { ok: false, error: "No tracking information found." };
  }

  const content = pageContentMatch[0];

  // Extract summary row from the first table
  const summaryMatch = content.match(
    /<td[^>]*class="td-bk"[^>]*>([^<]*)<\/td>\s*<td[^>]*class="td-bk"[^>]*>([^<]*)<\/td>\s*<td[^>]*class="td-bk"[^>]*>([^<]*)<\/td>\s*<td[^>]*class="td-bk"[^>]*>([^<]*)<\/td>/
  );

  let trackingNumber = "";
  let destination = "";
  let latestTime = "";
  let latestStatus = "";

  if (summaryMatch) {
    trackingNumber = summaryMatch[1].trim();
    destination = summaryMatch[2].trim();
    latestTime = summaryMatch[3].trim();
    latestStatus = summaryMatch[4].trim();
  }

  // Extract detail events from the second table only
  // The second table has 3 columns (日期, 转运地点, 转运记录)
  // while the first summary table has 4 columns.
  const secondTableMatch = content.match(/<table class="out_order">[\s\S]*?<\/table>/g);
  const events: TrackEvent[] = [];

  if (secondTableMatch && secondTableMatch.length >= 2) {
    const detailTable = secondTableMatch[1];
    const eventRegex =
      /<td[^>]*class="td-bk"[^>]*>([^<]*)<\/td>\s*<td[^>]*class="td-bk"[^>]*>([^<]*)<\/td>\s*<td[^>]*class="td-bk"[^>]*>([^<]*)<\/td>/g;

    let match;
    while ((match = eventRegex.exec(detailTable)) !== null) {
      const date = match[1].trim();
      const location = match[2].trim();
      const record = match[3].trim();
      // Skip header row
      if (date === "日期" || date === "当地时间") continue;
      events.push({ date, location, content: record });
    }
  }

  if (!trackingNumber && events.length === 0) {
    return { ok: false, error: "No tracking information found." };
  }

  return {
    ok: true,
    trackingNumber,
    destination,
    latestStatus,
    latestTime,
    events,
  };
}

export async function GET(request: NextRequest) {
  const number = request.nextUrl.searchParams.get("number");

  if (!number || !number.trim()) {
    return NextResponse.json(
      { ok: false, error: "Please enter a tracking number." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml",
        Referer: "http://zxdexpress.com/logistic.html",
      },
      body: new URLSearchParams({ numbers: number.trim() }).toString(),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "Tracking service unavailable. Please try again later." },
        { status: 502 }
      );
    }

    const html = await response.text();
    const result = parseLogisticHtml(html);

    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Network error. Please try again later." },
      { status: 500 }
    );
  }
}
