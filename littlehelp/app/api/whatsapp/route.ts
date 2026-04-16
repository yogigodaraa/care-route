import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

const PHASE3_API_URL =
  process.env.PHASE3_API_URL || "http://localhost:8000";

function formatTime(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeStr;
  }
}

interface ProviderAvailability {
  next_available?: string;
  profile_url?: string;
}

interface Provider {
  name: string;
  phone?: string;
  availability?: ProviderAvailability;
}

interface Phase2Response {
  care_type: string;
  urgency: string;
  message: string;
}

interface Phase3Response {
  providers: Provider[];
  ed_comparison?: {
    wait_time?: string;
  };
}

function extractLocation(message: string): string {
  // Check for Australian postcode (4 digits)
  const postcodeMatch = message.match(/\b(\d{4})\b/);
  if (postcodeMatch) return postcodeMatch[1];

  // Check for "in/near/at [Location]"
  const locationMatch = message.match(/(?:in|near|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  if (locationMatch) return locationMatch[1];

  return "Sydney CBD 2000";
}

function buildReplyMessage(
  phase2: Phase2Response,
  phase3: Phase3Response,
): string {
  const lines: string[] = [];

  lines.push(phase2.message || `Based on your symptoms, we suggest seeing a ${phase2.care_type} today.`);
  lines.push("");

  const top3 = (phase3.providers || []).slice(0, 3);
  top3.forEach((provider, i) => {
    const num = i + 1;
    const available = provider.availability?.next_available
      ? ` - Available ${formatTime(provider.availability.next_available)}`
      : "";
    lines.push(`${num}. ${provider.name}${available}`);
    if (provider.phone) {
      lines.push(`   Call: ${provider.phone}`);
    }
    if (provider.availability?.profile_url) {
      lines.push(`   Book: ${provider.availability.profile_url}`);
    }
  });

  if (phase3.ed_comparison?.wait_time) {
    lines.push("");
    lines.push(
      `Skip the ED wait (est. ${phase3.ed_comparison.wait_time}). Book a ${phase2.care_type} in minutes.`,
    );
  }

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const { from, message } = await request.json();

    if (!from || !message) {
      return NextResponse.json(
        { success: false, error: "Missing 'from' or 'message' field" },
        { status: 400 },
      );
    }

    // Phase 2: triage symptoms
    const phase2Res = await fetch(
      `${PHASE3_API_URL}/dummy-phase2?symptom=${encodeURIComponent(message)}`,
    );
    if (!phase2Res.ok) {
      throw new Error(`Phase 2 API error: ${phase2Res.status}`);
    }
    const phase2: Phase2Response = await phase2Res.json();

    // Phase 3: find providers
    const phase3Res = await fetch(`${PHASE3_API_URL}/find-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        care_type: phase2.care_type,
        location: extractLocation(message),
      }),
    });
    if (!phase3Res.ok) {
      throw new Error(`Phase 3 API error: ${phase3Res.status}`);
    }
    const phase3: Phase3Response = await phase3Res.json();

    // Build reply text first so it's always available
    const replyText = buildReplyMessage(phase2, phase3);
    const edComparison = phase3.ed_comparison;

    // Try to send SMS, but always return the reply text
    const smsResult = await sendSms(from, replyText);
    return NextResponse.json({
      success: smsResult.success,
      reply: replyText,
      ed_comparison: edComparison,
      ...(smsResult.success ? { sms: smsResult.data } : { error: smsResult.error }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      },
      { status: 500 },
    );
  }
}
