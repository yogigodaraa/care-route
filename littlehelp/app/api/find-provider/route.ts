import { NextRequest, NextResponse } from "next/server";

const PHASE3_URL = process.env.PHASE3_API_URL || "http://localhost:8000";

const FALLBACK_RESPONSE = {
  care_type: "gp",
  location: "Sydney CBD 2000",
  results_count: 5,
  ed_comparison: {
    nearest_ed: "Royal Prince Alfred Hospital",
    estimated_wait: "3-4 hours",
    estimated_wait_minutes: 210,
    source: "estimate",
  },
  providers: [
    {
      name: "Sydney Doctors",
      address: "Level 1/70 Pitt St, Sydney NSW 2000",
      phone: "(02) 9233 3399",
      website: "http://sydneydoctors.com.au/",
      google_maps_url: "https://maps.google.com/?q=Sydney+Doctors+Pitt+St",
      lat: -33.8688,
      lng: 151.2093,
      opening_hours: ["Monday-Friday: 8am-6pm", "Saturday: 9am-1pm"],
      open_now: true,
      bulk_billing: true,
      services: ["bulk billing", "pathology", "telehealth"],
      score: 95,
      availability: {
        source: "hotdoc",
        next_available: "8:45am",
        profile_url:
          "https://www.hotdoc.com.au/medical-centres/sydney-NSW-2000/sydney-doctors/doctors",
        bulk_billing: true,
        services: ["bulk billing", "pathology", "telehealth"],
      },
    },
    {
      name: "World Square Medical Centre",
      address: "Shop 6.17, 644 George St, Sydney NSW 2000",
      phone: "(02) 9264 8500",
      website: "http://worldsquaremedical.com.au/",
      google_maps_url:
        "https://maps.google.com/?q=World+Square+Medical+Centre+George+St+Sydney",
      lat: -33.8764,
      lng: 151.2071,
      opening_hours: [
        "Monday-Friday: 7:30am-7pm",
        "Saturday: 9am-5pm",
        "Sunday: 10am-3pm",
      ],
      open_now: true,
      bulk_billing: true,
      services: ["bulk billing", "skin checks", "vaccinations", "telehealth"],
      score: 91,
      availability: {
        source: "hotdoc",
        next_available: "9:15am",
        profile_url:
          "https://www.hotdoc.com.au/medical-centres/sydney-NSW-2000/world-square-medical/doctors",
        bulk_billing: true,
        services: [
          "bulk billing",
          "skin checks",
          "vaccinations",
          "telehealth",
        ],
      },
    },
    {
      name: "Martin Place Medical Centre",
      address: "Level 1, 50 Martin Pl, Sydney NSW 2000",
      phone: "(02) 9221 3355",
      website: "http://martinplacemedical.com.au/",
      google_maps_url:
        "https://maps.google.com/?q=Martin+Place+Medical+Centre+Sydney",
      lat: -33.8678,
      lng: 151.2109,
      opening_hours: ["Monday-Friday: 8am-5:30pm"],
      open_now: true,
      bulk_billing: false,
      services: ["travel medicine", "women's health", "mental health"],
      score: 87,
      availability: {
        source: "hotdoc",
        next_available: "10:30am",
        profile_url:
          "https://www.hotdoc.com.au/medical-centres/sydney-NSW-2000/martin-place-medical/doctors",
        bulk_billing: false,
        services: ["travel medicine", "women's health", "mental health"],
      },
    },
    {
      name: "CBD Medical Practice",
      address: "Suite 2, 135 Macquarie St, Sydney NSW 2000",
      phone: "(02) 9241 2880",
      website: "http://cbdmedicalpractice.com.au/",
      google_maps_url:
        "https://maps.google.com/?q=CBD+Medical+Practice+Macquarie+St+Sydney",
      lat: -33.8692,
      lng: 151.2137,
      opening_hours: [
        "Monday-Friday: 8:30am-6pm",
        "Saturday: 9am-12pm",
      ],
      open_now: true,
      bulk_billing: true,
      services: ["bulk billing", "chronic disease management", "pathology"],
      score: 84,
      availability: {
        source: "hotdoc",
        next_available: "11:00am",
        profile_url:
          "https://www.hotdoc.com.au/medical-centres/sydney-NSW-2000/cbd-medical-practice/doctors",
        bulk_billing: true,
        services: ["bulk billing", "chronic disease management", "pathology"],
      },
    },
    {
      name: "Town Hall Clinic",
      address: "Level 4, 301 George St, Sydney NSW 2000",
      phone: "(02) 9267 7444",
      website: "http://townhallclinic.com.au/",
      google_maps_url:
        "https://maps.google.com/?q=Town+Hall+Clinic+George+St+Sydney",
      lat: -33.8717,
      lng: 151.2068,
      opening_hours: ["Monday-Friday: 9am-5pm"],
      open_now: false,
      bulk_billing: false,
      services: ["men's health", "skin checks", "minor procedures"],
      score: 80,
      availability: {
        source: "hotdoc",
        next_available: "Tomorrow 9:15am",
        profile_url:
          "https://www.hotdoc.com.au/medical-centres/sydney-NSW-2000/town-hall-clinic/doctors",
        bulk_billing: false,
        services: ["men's health", "skin checks", "minor procedures"],
      },
    },
  ],
};

function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 60000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
}

function fallbackResponse() {
  return NextResponse.json({ ...FALLBACK_RESPONSE, _fallback: true });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symptom = searchParams.get("symptom");
  let care_type = searchParams.get("care_type");
  const location = searchParams.get("location") || "Sydney CBD 2000";

  if (!symptom && !care_type) {
    return NextResponse.json(
      { error: "Either 'symptom' or 'care_type' query parameter is required" },
      { status: 400 }
    );
  }

  try {
    let triageData: Record<string, unknown> | null = null;

    if (!care_type && symptom) {
      const phase2Res = await fetchWithTimeout(
        `${PHASE3_URL}/dummy-phase2?symptom=${encodeURIComponent(symptom)}`
      );
      if (!phase2Res.ok) {
        const error = await phase2Res.text();
        return NextResponse.json(
          { error: `Phase 2 API error: ${error}` },
          { status: phase2Res.status }
        );
      }
      const phase2Data = await phase2Res.json();
      care_type = phase2Data.care_type;
      triageData = phase2Data;
    }

    const response = await fetchWithTimeout(`${PHASE3_URL}/find-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ care_type, location }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Phase 3 API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (triageData) {
      data.triage = triageData;
    }
    return NextResponse.json(data);
  } catch {
    return fallbackResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetchWithTimeout(`${PHASE3_URL}/find-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Phase 3 API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return fallbackResponse();
  }
}
