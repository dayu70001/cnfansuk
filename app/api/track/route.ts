import { NextRequest, NextResponse } from "next/server";

const TARGET_API = "http://120.78.152.35/api/re-toms/v1";

interface TrackApiResponse {
  code: number;
  message: string;
  error: string[];
  data?: Array<{
    ask: number;
    code: string;
    message: string;
    data: Array<{
      track_date?: string;
      track_content?: string;
      track_location?: string;
      [key: string]: unknown;
    }>;
  }>;
}

function buildPayload(number: string) {
  const timestamp = Date.now();
  return {
    method: "getTruckTrackInfo",
    param: {
      codes: number.trim(),
      noUserCode: "1",
    },
    timestamp,
    token: "test",
    lang: "zh_CN",
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
    const response = await fetch(TARGET_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Referer: "http://120.78.152.35/",
      },
      body: JSON.stringify(buildPayload(number)),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "Tracking service unavailable. Please try again later." },
        { status: 502 }
      );
    }

    const result = (await response.json()) as TrackApiResponse;

    if (result.code !== 200) {
      return NextResponse.json(
        { ok: false, error: result.message || "Query failed." },
        { status: 502 }
      );
    }

    const item = result.data?.[0];
    if (!item) {
      return NextResponse.json(
        { ok: false, error: "No tracking information found." },
        { status: 404 }
      );
    }

    // Simple status mapping
    const statusMap: Record<number, string> = {
      0: "Not found",
      1: "In transit",
      2: "Delivered",
      3: "Delivery failed",
      4: "Returned",
      5: "Picked up",
    };

    return NextResponse.json({
      ok: true,
      trackingNumber: item.code,
      status: statusMap[item.ask] || "Unknown",
      statusCode: item.ask,
      message: item.message,
      events:
        item.data?.map((e) => ({
          date: e.track_date || "",
          content: e.track_content || "",
          location: e.track_location || "",
        })) || [],
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Network error. Please try again later." },
      { status: 500 }
    );
  }
}
