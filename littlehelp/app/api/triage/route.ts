import { NextRequest, NextResponse } from "next/server";

const PHASE3_URL = process.env.PHASE3_API_URL || "http://localhost:8000";

function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symptomId = searchParams.get("symptom_id");

  if (!symptomId) {
    return NextResponse.json({ error: "symptom_id is required" }, { status: 400 });
  }

  try {
    const res = await fetchWithTimeout(`${PHASE3_URL}/model2/questions/${encodeURIComponent(symptomId)}`);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Triage service unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetchWithTimeout(`${PHASE3_URL}/model2/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Evaluation failed" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Triage service unavailable" }, { status: 503 });
  }
}
