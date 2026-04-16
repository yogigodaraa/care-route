import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: "Missing 'to' or 'message' field" },
        { status: 400 }
      );
    }

    const result = await sendSms(to, message);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}
