import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

const PHASE3_API_URL =
  process.env.PHASE3_API_URL || "http://localhost:8000";

interface AlertRequest {
  parent_phone: string;
  child_name: string;
  symptoms: string;
  childcare_name: string;
  childcare_address: string;
}

function extractState(address: string): string {
  const stateMap: Record<string, string> = {
    "nsw": "nsw", "new south wales": "nsw",
    "vic": "vic", "victoria": "vic",
    "qld": "qld", "queensland": "qld",
    "sa": "sa", "south australia": "sa",
    "wa": "wa", "western australia": "wa",
    "tas": "tas", "tasmania": "tas",
    "nt": "nt", "northern territory": "nt",
    "act": "act",
  };

  const lower = address.toLowerCase();
  for (const [key, value] of Object.entries(stateMap)) {
    if (lower.includes(key)) return value;
  }

  // Try postcode ranges
  const postcodeMatch = address.match(/\b(\d{4})\b/);
  if (postcodeMatch) {
    const pc = parseInt(postcodeMatch[1]);
    if (pc >= 2000 && pc <= 2999) return "nsw";
    if (pc >= 3000 && pc <= 3999) return "vic";
    if (pc >= 4000 && pc <= 4999) return "qld";
    if (pc >= 5000 && pc <= 5999) return "sa";
    if (pc >= 6000 && pc <= 6999) return "wa";
    if (pc >= 7000 && pc <= 7999) return "tas";
    if (pc >= 800 && pc <= 899) return "nt";
    if (pc >= 2600 && pc <= 2618) return "act";
  }

  return "nsw"; // default
}

function formatProviderLine(p: any, index: number): string {
  const name = p.name || "Provider";
  const parts: string[] = [`${index}. ${name}`];

  const avail = p.availability;
  if (avail?.next_available) {
    parts[0] += ` \u2014 Available ${avail.next_available}`;
  }
  if (p.distance_text) {
    parts[0] += `, ${p.distance_text} away`;
  }

  if (p.phone) {
    parts.push(`   Call: ${p.phone}`);
  }
  if (avail?.booking_url) {
    parts.push(`   Book: ${avail.booking_url}`);
  }

  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body: AlertRequest = await request.json();
    const {
      parent_phone,
      child_name,
      symptoms,
      childcare_name,
      childcare_address,
    } = body;

    if (!parent_phone || !child_name || !symptoms || !childcare_name || !childcare_address) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Step 1: Call Phase 2 to determine care type from symptoms
    const phase2Res = await fetch(
      `${PHASE3_API_URL}/dummy-phase2?symptom=${encodeURIComponent(symptoms)}`,
    );
    const phase2Data = await phase2Res.json();
    const careType = phase2Data.care_type || "gp";

    // Step 2: Call Phase 3 to find nearby providers
    const phase3Res = await fetch(`${PHASE3_API_URL}/find-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        care_type: careType,
        location: childcare_address,
        state: extractState(childcare_address),
        radius: 5000,
      }),
    });
    const phase3Data = await phase3Res.json();

    const providers = (phase3Data.providers || []).slice(0, 2);
    const edComparison = phase3Data.ed_comparison;

    // Step 3: Format SMS
    const careLabel =
      careType === "ed"
        ? "an Emergency Department"
        : careType === "pharmacy"
          ? "a pharmacy"
          : careType === "clinic"
            ? "an urgent care clinic"
            : "a GP";

    let sms = `[${childcare_name}] ${child_name} has ${symptoms}. Please pick up soon.\n`;

    if (providers.length > 0) {
      sms += `\nWe found ${careLabel} nearby:\n`;
      providers.forEach((p: any, i: number) => {
        sms += formatProviderLine(p, i + 1) + "\n";
      });
    }

    if (edComparison && careType !== "ed") {
      sms += `\nNo need for ED (est. ${edComparison.estimated_wait} wait). A GP can help today.`;
    }

    // Step 4: Send SMS via shared utility
    const smsResult = await sendSms(parent_phone, sms);

    if (!smsResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: smsResult.error,
          sms_preview: sms,
          providers,
          care_type: careType,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      sms_preview: sms,
      care_type: careType,
      providers_found: providers.length,
      sms_response: smsResult.data,
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
