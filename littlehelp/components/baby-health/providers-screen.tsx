"use client";

import { useEffect, useState, useMemo } from "react";
import {
  MapPin,
  Phone,
  Clock,
  ArrowLeft,
  Home,
  ExternalLink,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Provider {
  name: string;
  address: string;
  phone: string;
  website: string;
  google_maps_url: string;
  score: number;
  open_now: boolean | null;
  opening_hours: string[];
  availability: {
    source?: string;
    next_available?: string;
    profile_url?: string;
    distance_km?: number;
    wait_time_text?: string;
    wait_minutes?: number;
    bulk_billing?: boolean | null;
    services?: string[];
    doctor_name?: string;
    doctors?: string[];
  };
}

interface EdComparison {
  nearest_ed: string;
  estimated_wait: string;
  estimated_wait_minutes: number;
}

interface ProvidersScreenProps {
  careType: "gp" | "ed" | "pharmacy" | "clinic";
  onBack: () => void;
  onHome: () => void;
}

const CARE_TYPE_LABELS: Record<string, string> = {
  gp: "GPs",
  ed: "Emergency Departments",
  pharmacy: "Pharmacies",
  clinic: "Walk-in Clinics",
};

const SERVICE_COLORS: Record<string, string> = {
  "Bulk billing": "bg-green-100 text-green-800",
  "X-ray": "bg-blue-100 text-blue-800",
  "Pathology": "bg-purple-100 text-purple-800",
  "After-hours": "bg-orange-100 text-orange-800",
  "Telehealth": "bg-cyan-100 text-cyan-800",
  "Children welcome": "bg-pink-100 text-pink-800",
};

function generateWhatToExpect(services: string[]): string {
  const parts: string[] = [];
  const sLower = services.map((s) => s.toLowerCase());

  if (sLower.some((s) => s.includes("children") || s.includes("paediatric"))) {
    parts.push("child-friendly consultations");
  }
  if (sLower.some((s) => s.includes("x-ray") || s.includes("imaging"))) {
    parts.push("on-site imaging");
  }
  if (sLower.some((s) => s.includes("pathology") || s.includes("blood"))) {
    parts.push("pathology on-site");
  }
  if (sLower.some((s) => s.includes("telehealth") || s.includes("video"))) {
    parts.push("telehealth appointments available");
  }
  if (sLower.some((s) => s.includes("after-hours") || s.includes("weekend"))) {
    parts.push("after-hours availability");
  }
  if (sLower.some((s) => s.includes("bulk billing") || s.includes("bulk"))) {
    parts.push("no out-of-pocket costs with Medicare");
  }

  if (parts.length === 0) {
    return "This clinic can handle fevers, minor injuries, and common infections. Call ahead to confirm services.";
  }

  const intro = "This clinic can handle fevers, minor injuries, and infections.";
  const extras = parts.length > 0 ? " Includes " + parts.join(", ") + "." : "";
  return intro + extras;
}

export function ProvidersScreen({ careType, onBack, onHome }: ProvidersScreenProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edComparison, setEdComparison] = useState<EdComparison | null>(null);
  const [bulkBillingOnly, setBulkBillingOnly] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [locationStatus, setLocationStatus] = useState<"requesting" | "granted" | "denied" | "fallback">("requesting");
  const [manualLocation, setManualLocation] = useState("");

  const showEdComparison = careType !== "ed" && edComparison !== null;

  const filteredProviders = useMemo(() => {
    if (!bulkBillingOnly) return providers;
    return providers.filter((p) => p.availability?.bulk_billing === true);
  }, [providers, bulkBillingOnly]);

  const toggleExpanded = (index: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const fetchProviders = async (locationOverride?: string) => {
    setLoading(true);
    setError(null);

    try {
      let lat: number | undefined;
      let lng: number | undefined;
      let location = "Sydney CBD 2000";

      if (locationOverride) {
        location = locationOverride;
        setLocationStatus("fallback");
      } else {
        try {
          setLocationStatus("requesting");
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          location = `${lat},${lng}`;
          setLocationStatus("granted");
        } catch {
          setLocationStatus("fallback");
        }
      }

      const res = await fetch("/api/find-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          care_type: careType,
          location,
          lat,
          lng,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch providers");

      const data = await res.json();
      setProviders(data.providers || []);
      if (data.ed_comparison) {
        setEdComparison(data.ed_comparison);
      }
    } catch (err) {
      setError("Could not find providers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [careType]);

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onHome}
          className="rounded-full"
        >
          <Home className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">
          Nearby {CARE_TYPE_LABELS[careType] || "Providers"}
        </h1>
      </div>

      {/* Location fallback banner */}
      {locationStatus === "fallback" && !loading && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-sm text-orange-700">
          <p className="font-medium">Using default location: Sydney CBD</p>
          <p className="text-xs mt-1">Allow location access for results near you, or enter your suburb below:</p>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Enter suburb or postcode"
              className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualLocation.trim()) {
                  fetchProviders(manualLocation.trim());
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                if (manualLocation.trim()) {
                  fetchProviders(manualLocation.trim());
                }
              }}
            >
              Search
            </Button>
          </div>
        </div>
      )}

      {/* ED Wait Time Comparison Banner */}
      {showEdComparison && !loading && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-sm">ED Wait Comparison</span>
          </div>
          <p className="text-sm opacity-95">
            Nearest ED: {edComparison.nearest_ed} — est.{" "}
            {edComparison.estimated_wait} wait
          </p>
          <p className="text-xs mt-1 opacity-80">
            A GP or clinic below may be much faster for non-emergencies.
          </p>
        </div>
      )}

      {/* Time savings summary */}
      {showEdComparison && !loading && edComparison && edComparison.estimated_wait_minutes > 15 && (
        <div className="mb-4 rounded-xl bg-green-100 border-2 border-green-400 p-4 text-green-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold text-center">
            You'll save approximately {edComparison.estimated_wait_minutes - 15} minutes by seeing a GP instead of going to {edComparison.nearest_ed}
          </p>
        </div>
      )}

      {/* Bulk Billing Toggle — only show when we have real bulk billing data */}
      {!loading && !error && providers.length > 0 && providers.some((p) => p.availability?.bulk_billing === true) && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-[#e9e1db]/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Bulk billing only
            </span>
          </div>
          <button
            role="switch"
            aria-checked={bulkBillingOnly}
            onClick={() => setBulkBillingOnly((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              bulkBillingOnly ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                bulkBillingOnly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Finding available {CARE_TYPE_LABELS[careType]?.toLowerCase()}...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-0 bg-urgent/10 shadow-sm">
          <CardContent className="p-5 text-center">
            <p className="text-urgent-foreground">{error}</p>
            <Button onClick={onBack} variant="outline" className="mt-4">
              Go back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && !error && (
        <div className="space-y-3 pb-6">
          {locationStatus === "fallback" && filteredProviders.length > 0 && (
            <p className="text-xs text-center text-muted-foreground italic">
              Showing results for Sydney CBD — enter your location above for local results
            </p>
          )}
          {filteredProviders.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {bulkBillingOnly
                ? "No bulk billing providers found. Try turning off the filter."
                : "No providers found nearby."}
            </p>
          )}

          {filteredProviders.map((provider, i) => {
            const services = provider.availability?.services || [];
            const isBulkBilling = provider.availability?.bulk_billing === true;
            const allTags = [
              ...(isBulkBilling && !services.some((s) => s.toLowerCase().includes("bulk"))
                ? ["Bulk billing"]
                : []),
              ...services,
            ];
            const waitMinutes = provider.availability?.wait_minutes;
            const isExpanded = expandedCards.has(i);

            return (
              <Card
                key={i}
                className="border-0 bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <CardContent className="p-4">
                  {/* Name + availability badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground leading-tight">
                      {provider.name}
                    </h3>
                    {provider.availability?.source === "hotdoc" && provider.availability?.next_available && (
                      <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success-foreground">
                        {provider.availability.wait_time_text || provider.availability.next_available}
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  <p className="text-sm text-muted-foreground mb-1">
                    {provider.address}
                  </p>

                  {/* Doctor name + appointment time — only from real scraped data */}
                  {provider.availability?.source === "hotdoc" && (
                    <div className="mb-2 space-y-0.5">
                      {provider.availability?.doctor_name && (
                        <p className="text-sm font-medium text-foreground/80">
                          {provider.availability.doctor_name}
                          {provider.availability?.next_available && (
                            <span className="text-success-foreground"> — next at {provider.availability.next_available}</span>
                          )}
                        </p>
                      )}
                      {!provider.availability?.doctor_name && provider.availability?.doctors && provider.availability.doctors.length > 0 && (
                        <p className="text-sm font-medium text-foreground/80">
                          {provider.availability.doctors.slice(0, 2).join(", ")}
                          {provider.availability.doctors.length > 2 && ` +${provider.availability.doctors.length - 2} more`}
                          {provider.availability?.next_available && (
                            <span className="text-success-foreground"> — next at {provider.availability.next_available}</span>
                          )}
                        </p>
                      )}
                      {!provider.availability?.doctor_name && (!provider.availability?.doctors || provider.availability.doctors.length === 0) && provider.availability?.next_available && (
                        <p className="text-sm font-medium text-success-foreground">
                          Next appointment: {provider.availability.next_available}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ED comparison bar — most visible element */}
                  {showEdComparison && edComparison && (
                    <div className="mb-3 rounded-lg bg-green-500 px-3 py-2.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-white shrink-0" />
                        <span className="text-sm font-bold text-white leading-snug">
                          {provider.availability?.source === "hotdoc" && provider.availability?.next_available
                            ? `Next appt: ${provider.availability.next_available}${provider.availability?.doctor_name ? ` with ${provider.availability.doctor_name}` : ""}`
                            : provider.open_now ? "Open now — call to book" : "Call to check availability"}{" "}
                          | {edComparison.nearest_ed}: est. {edComparison.estimated_wait} wait
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Capability Tags */}
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {allTags.map((tag) => (
                        <span
                          key={tag}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            SERVICE_COLORS[tag] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Info row */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    {provider.open_now !== null && (
                      <span
                        className={`flex items-center gap-1 ${provider.open_now ? "text-success-foreground" : "text-urgent-foreground"}`}
                      >
                        <Clock className="w-3 h-3" />
                        {provider.open_now ? "Open now" : "Closed"}
                      </span>
                    )}
                    {provider.availability?.distance_km !== undefined && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {provider.availability.distance_km} km
                      </span>
                    )}
                    {provider.availability?.source === "hotdoc" && (
                      <span className="text-success-foreground font-medium">
                        Live availability
                      </span>
                    )}
                  </div>

                  {/* What to expect - expandable */}
                  {allTags.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleExpanded(i)}
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        What to expect
                      </button>
                      {isExpanded && (
                        <div className="mt-2 rounded-lg bg-[#e9e1db]/40 px-3 py-2 text-xs text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                          {generateWhatToExpect(allTags)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {provider.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => window.open(`tel:${provider.phone}`)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                    {provider.availability?.profile_url && (
                      <Button
                        size="sm"
                        className="rounded-xl text-xs bg-primary"
                        onClick={() =>
                          window.open(
                            provider.availability.profile_url,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Book
                      </Button>
                    )}
                    {provider.google_maps_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() =>
                          window.open(provider.google_maps_url, "_blank")
                        }
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Directions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-center text-muted-foreground mt-auto pt-4 px-4 leading-relaxed">
        <p className="font-medium">This tool provides care navigation, not medical diagnosis. In an emergency, call <a href="tel:000" className="underline font-semibold">000</a> immediately.</p>
        <p className="mt-1">Availability shown may not be real-time. Always call ahead to confirm.</p>
      </div>
    </div>
  );
}
