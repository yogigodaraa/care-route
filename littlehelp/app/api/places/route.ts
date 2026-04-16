import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_PLACES_API_KEY" },
      { status: 500 },
    );
  }

  const url = "https://places.googleapis.com/v1/places:searchText";
  const address = request.nextUrl.searchParams.get("address");
  const careType = request.nextUrl.searchParams.get("careType");

  const body = {
    textQuery: `${careType} near ${address}`,
    locationBias: {
      circle: {
        radius: 25000,
      },
    },
    maxResultCount: 10,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.location,places.regularOpeningHours.weekdayDescriptions,places.nationalPhoneNumber",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data.places ?? []);
}
