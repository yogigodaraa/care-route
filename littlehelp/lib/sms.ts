const MOBILE_MESSAGE_URL = "https://api.mobilemessage.com.au/v1/messages";
const SENDER_NUMBER = "61485900155";

export async function sendSms(to: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const apiKey = process.env.MOBILE_MESSAGE_API_KEY;
  const apiSecret = process.env.MOBILE_MESSAGE_API_SECRET;

  if (!apiKey || !apiSecret) {
    return { success: false, error: "Missing Mobile Message credentials" };
  }

  // Normalize AU phone number
  let normalizedTo = to.replace(/\s+/g, "").replace(/^0/, "61");
  if (!normalizedTo.startsWith("61")) normalizedTo = "61" + normalizedTo;

  try {
    const response = await fetch(MOBILE_MESSAGE_URL, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enable_unicode: true,
        messages: [{ to: normalizedTo, message, sender: SENDER_NUMBER }],
      }),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) return { success: false, error: JSON.stringify(data) };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "SMS send failed" };
  }
}
