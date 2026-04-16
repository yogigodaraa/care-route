import { NextRequest, NextResponse } from "next/server";

const PHASE3_URL = process.env.PHASE3_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gpName = searchParams.get("gp_name");
  const location = searchParams.get("location") || "Sydney CBD 2000";

  if (!gpName) {
    return NextResponse.json(
      { error: "gp_name query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${PHASE3_URL}/find-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `GP or medical clinic open now near ${location}`,
        location,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Provider finder error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract top 3 alternatives from the response
    const providers: Array<Record<string, unknown>> =
      data.providers || data.results || [];
    const alternatives = providers.slice(0, 3).map((p: Record<string, unknown>) => {
      const availability = (p.availability || {}) as Record<string, unknown>;
      return {
        name: p.name || "Nearby clinic",
        address: p.address || p.location || "",
        phone: p.phone || p.phone_number || "",
        next_available: availability.next_available || p.next_available || "",
        booking_url: availability.profile_url || p.booking_url || "",
      };
    });

    // Extract ED comparison data if available
    const edComparison = data.ed_comparison || data.ed_wait || null;

    // Build SMS-ready message
    const topProvider = alternatives[0];
    let smsMessage = `${gpName} is closed.`;
    if (topProvider) {
      const name = topProvider.name;
      const phone = topProvider.phone;
      const nextSlot = topProvider.next_available;
      const bookingUrl = topProvider.booking_url;

      smsMessage += ` Nearest open GP: ${name}`;
      if (nextSlot) smsMessage += `, available ${nextSlot}`;
      if (phone) smsMessage += `. Call ${phone}`;
      if (bookingUrl) smsMessage += ` or book at ${bookingUrl}`;
      smsMessage += ".";
    } else {
      smsMessage += " No alternatives found right now. Try healthdirect.gov.au or call 1800 022 222.";
    }

    return NextResponse.json({
      original_gp: gpName,
      status: "closed",
      message: `${gpName} is currently closed. Here are nearby alternatives available right now:`,
      alternatives,
      ed_comparison: edComparison,
      sms_message: smsMessage,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to provider finder service" },
      { status: 503 }
    );
  }
}
