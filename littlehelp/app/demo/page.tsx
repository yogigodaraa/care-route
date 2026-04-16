"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, MessageSquare, Phone, Bell, Search, ExternalLink, ArrowRight, Activity, Heart, Shield, Send } from "lucide-react"

interface Provider {
  name: string
  address: string
  phone: string
  website: string
  google_maps_url: string
  score: number
  open_now: boolean | null
  bulk_billing: boolean | null
  services: string[]
  availability: {
    source?: string
    next_available?: string
    profile_url?: string
    distance_km?: number
  }
}

interface EDComparison {
  name?: string
  wait_time?: string
  nearest_ed?: string
  estimated_wait?: string
}

interface TriageInfo {
  care_type: string
  urgency: string
}

interface ChatMessage {
  role: "user" | "bot"
  text: string
}

const SERVICE_COLORS: Record<string, string> = {
  "bulk billing": "bg-green-100 text-green-700",
  "x-ray": "bg-blue-100 text-blue-700",
  "pathology": "bg-purple-100 text-purple-700",
  "after-hours": "bg-orange-100 text-orange-700",
  "telehealth": "bg-teal-100 text-teal-700",
  "vaccination": "bg-pink-100 text-pink-700",
  "mental health": "bg-indigo-100 text-indigo-700",
}

function getServiceColor(service: string): string {
  const key = service.toLowerCase()
  for (const [pattern, color] of Object.entries(SERVICE_COLORS)) {
    if (key.includes(pattern)) return color
  }
  return "bg-gray-100 text-gray-600"
}

async function fetchProviders(symptom: string, loc: string) {
  const res = await fetch(
    `/api/find-provider?symptom=${encodeURIComponent(symptom)}&location=${encodeURIComponent(loc)}`
  )
  return await res.json()
}

export default function DemoPage() {
  const [symptom, setSymptom] = useState("fever")
  const [location, setLocation] = useState("Sydney CBD 2000")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Provider[] | null>(null)
  const [edComparison, setEdComparison] = useState<EDComparison | null>(null)
  const [triageInfo, setTriageInfo] = useState<TriageInfo | null>(null)
  const [error, setError] = useState("")
  const [bulkBillingOnly, setBulkBillingOnly] = useState(false)
  const [resultsHeader, setResultsHeader] = useState("")

  // SMS demo state
  const [smsPhone, setSmsPhone] = useState("")
  const [smsSymptom, setSmsSymptom] = useState("")
  const [smsStatus, setSmsStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [smsError, setSmsError] = useState("")
  const [smsReply, setSmsReply] = useState("")

  // WhatsApp chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  const didAutoLoad = useRef(false)

  function processApiResponse(data: Record<string, unknown>) {
    if (data.ed_comparison) {
      setEdComparison(data.ed_comparison as EDComparison)
    }
    if (data.triage) {
      setTriageInfo(data.triage as TriageInfo)
    } else if (data.care_type) {
      setTriageInfo({ care_type: data.care_type as string, urgency: (data.urgency as string) || "routine" })
    }
    if (data.care_type) {
      const ct = (data.care_type as string).toUpperCase()
      setResultsHeader(`Based on your symptoms: See a ${ct} today`)
    }
    if (data.providers) {
      setResults(data.providers as Provider[])
    } else if (data.results) {
      setResults(data.results as Provider[])
    } else if (Array.isArray(data)) {
      setResults(data as Provider[])
    } else {
      setResults([])
    }
  }

  // Auto-load on mount
  useEffect(() => {
    if (didAutoLoad.current) return
    didAutoLoad.current = true
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchProviders("fever", "Sydney CBD 2000")
        processApiResponse(data)
      } catch {
        setError("Could not reach the API. Make sure the dev server is running.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function handleFindCare(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResults(null)
    setEdComparison(null)
    setTriageInfo(null)
    setResultsHeader("")
    try {
      const data = await fetchProviders(symptom, location || "Sydney CBD 2000")
      processApiResponse(data)
    } catch {
      setError("Could not reach the API. Make sure the dev server is running.")
    } finally {
      setLoading(false)
    }
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }])
    setChatLoading(true)
    try {
      const data = await fetchProviders(userMsg, "Sydney CBD 2000")
      const providers = (data.providers || data.results || []) as Provider[]
      const careType = data.care_type ? (data.care_type as string).toUpperCase() : "GP"
      let reply = `Triage: ${careType}. `
      if (providers.length > 0) {
        reply += `Here are ${Math.min(providers.length, 3)} providers with availability:\n`
        providers.slice(0, 3).forEach((p: Provider, i: number) => {
          reply += `${i + 1}. ${p.name}`
          if (p.availability?.next_available) reply += ` -- ${p.availability.next_available}`
          reply += "\n"
        })
        if (data.ed_comparison) {
          const ed = data.ed_comparison as EDComparison
          reply += `\nSkip the ED (${ed.nearest_ed || ed.name || "Local Hospital"}: ~${ed.estimated_wait || ed.wait_time || "3-4hr"} wait)`
        }
      } else {
        reply += "No providers found nearby. Try a different symptom."
      }
      setChatMessages((prev) => [...prev, { role: "bot", text: reply }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", text: "Error: Could not reach the API." }])
    } finally {
      setChatLoading(false)
    }
  }

  async function handleSendSms(e: React.FormEvent) {
    e.preventDefault()
    setSmsStatus("sending")
    setSmsError("")
    setSmsReply("")
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: smsPhone, message: smsSymptom }),
      })
      const data = await res.json()
      if (data.success) {
        setSmsStatus("sent")
        setSmsReply(data.reply || "")
      } else {
        setSmsStatus("error")
        setSmsError(data.error || "Failed to send SMS")
      }
    } catch {
      setSmsStatus("error")
      setSmsError("Could not reach the API. Make sure the dev server is running.")
    }
  }

  const filteredResults = results
    ? bulkBillingOnly
      ? results.filter((p) => p.bulk_billing === true)
      : results
    : null

  const edName = edComparison?.nearest_ed || edComparison?.name || "Local Hospital"
  const edWait = edComparison?.estimated_wait || edComparison?.wait_time || "3-4hr"

  const channels = [
    {
      icon: Mic,
      title: "Voice Triage",
      description: "Tap mic, describe symptoms, get routed to the right care in under 60 seconds.",
      detail: "AI-powered symptom analysis with real-time provider matching",
      href: "/",
      linkLabel: "Try it live",
      color: "from-orange-400 to-pink-400",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp / SMS Bot",
      description: "Text your symptoms, get 3 providers with live availability -- no app download needed.",
      detail: null,
      href: null,
      linkLabel: null,
      color: "from-green-400 to-emerald-400",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      liveChat: true,
    },
    {
      icon: Phone,
      title: "GP Voicemail Redirect",
      description: "Replace dead-end GP voicemail with a live care router that finds open slots nearby.",
      detail: "Works with existing phone systems -- zero patient behaviour change",
      href: "/api/voicemail-redirect/demo",
      linkLabel: "See demo flow",
      color: "from-blue-400 to-indigo-400",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      icon: Bell,
      title: "Childcare Centre Alert",
      description: "Sick child notification instantly routes parents to a nearby GP with availability.",
      detail: "Integrates with childcare management systems",
      href: "/api/childcare-alert/demo",
      linkLabel: "See demo flow",
      color: "from-purple-400 to-pink-400",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500",
    },
    {
      icon: Search,
      title: "Provider Finder API",
      description: "Real-time HotDoc scraping for 33+ providers. Sub-second availability lookups.",
      detail: null,
      href: null,
      linkLabel: null,
      color: "from-amber-400 to-orange-400",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      curlExample: true,
    },
  ]

  return (
    <div className="min-h-screen bg-[#e9e1db]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-pink-400/10 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium text-orange-700 mb-6">
            <Heart className="size-4" />
            Hackathon Demo
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
            Little Help
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-semibold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Care Routing Engine
          </p>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            5 interception channels, 1 API, 60 seconds from panic to booked appointment
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 -mt-2 mb-12">
        <div className="bg-white/70 backdrop-blur rounded-2xl shadow-sm border border-white/50 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">3.1M</p>
              <p className="text-sm text-gray-500">avoidable ED visits/year</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">$500-800</p>
              <p className="text-sm text-gray-500">per ED visit</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">75%</p>
              <p className="text-sm text-gray-500">never tried their GP</p>
            </div>
          </div>
        </div>
      </section>

      {/* Channel Cards */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Interception Channels</h2>
        <p className="text-gray-500 text-center mb-8">Every place the system currently fails -- we show up instead</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {channels.map((ch) => (
            <Card key={ch.title} className="bg-white/80 backdrop-blur border-white/50 overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-1.5 bg-gradient-to-r ${ch.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className={`${ch.bgColor} rounded-lg p-2.5`}>
                    <ch.icon className={`size-5 ${ch.iconColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{ch.title}</CardTitle>
                    <CardDescription className="mt-1 text-sm leading-relaxed">{ch.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {ch.detail && (
                  <p className="text-xs text-gray-400 mb-3">{ch.detail}</p>
                )}

                {/* Live WhatsApp Chat */}
                {ch.liveChat && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2 mb-3 font-mono">
                    {/* Chat messages */}
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {chatMessages.length === 0 && (
                        <p className="text-gray-400 text-center text-[10px] py-2">Type a symptom to get live results</p>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <span
                            className={`rounded-lg px-2 py-1 max-w-[220px] whitespace-pre-wrap ${
                              msg.role === "user"
                                ? "bg-green-100 text-green-800"
                                : "bg-white border text-gray-700"
                            }`}
                          >
                            {msg.text}
                          </span>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <span className="bg-white border rounded-lg px-2 py-1 text-gray-400">Searching...</span>
                        </div>
                      )}
                    </div>
                    {/* Chat input */}
                    <div className="flex gap-1 pt-1 border-t border-gray-200">
                      <input
                        type="text"
                        placeholder="e.g. my child has a rash"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleChatSend() }}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-300"
                      />
                      <button
                        onClick={handleChatSend}
                        disabled={chatLoading}
                        className="bg-green-500 text-white rounded px-2 py-1 text-[10px] font-medium hover:bg-green-600 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {/* Curl example */}
                {ch.curlExample && (
                  <div className="bg-gray-900 rounded-lg p-3 text-xs text-green-300 font-mono mb-3 overflow-x-auto">
                    <code>
                      curl &quot;/api/find-provider<br />
                      &nbsp;&nbsp;?symptom=fever<br />
                      &nbsp;&nbsp;&amp;location=Sydney+CBD+2000&quot;
                    </code>
                  </div>
                )}

                {ch.href && (
                  <Link href={ch.href}>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-sm">
                      {ch.linkLabel}
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white/50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">How It Works -- One API, Five Channels</h2>
          <p className="text-sm text-gray-500 text-center mb-8">End-to-end data flow from symptom to booked appointment</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 overflow-x-auto py-4">
            {/* Step 1 */}
            <div className="flex-shrink-0 bg-gradient-to-br from-orange-100 to-orange-200 border border-orange-300 rounded-xl px-4 py-3 text-center shadow-sm min-w-[130px]">
              <p className="text-xs font-semibold text-orange-800">Symptom Input</p>
              <p className="text-[10px] text-orange-600 mt-0.5">SMS / Voice / Web</p>
            </div>
            <div className="text-orange-400 font-bold text-xl px-2 rotate-90 sm:rotate-0">&rarr;</div>

            {/* Step 2 */}
            <div className="flex-shrink-0 bg-gradient-to-br from-pink-100 to-pink-200 border border-pink-300 rounded-xl px-4 py-3 text-center shadow-sm min-w-[130px]">
              <p className="text-xs font-semibold text-pink-800">AI Triage</p>
              <p className="text-[10px] text-pink-600 mt-0.5">Care type + urgency</p>
            </div>
            <div className="text-pink-400 font-bold text-xl px-2 rotate-90 sm:rotate-0">&rarr;</div>

            {/* Step 3 */}
            <div className="flex-shrink-0 bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300 rounded-xl px-4 py-3 text-center shadow-sm min-w-[160px]">
              <p className="text-xs font-semibold text-purple-800">Data Aggregation</p>
              <p className="text-[10px] text-purple-600 mt-0.5">HotDoc + Google Places + ED Waits</p>
            </div>
            <div className="text-purple-400 font-bold text-xl px-2 rotate-90 sm:rotate-0">&rarr;</div>

            {/* Step 4 */}
            <div className="flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 rounded-xl px-4 py-3 text-center shadow-sm min-w-[130px]">
              <p className="text-xs font-semibold text-blue-800">Ranked Results</p>
              <p className="text-[10px] text-blue-600 mt-0.5">Scored + filtered</p>
            </div>
            <div className="text-blue-400 font-bold text-xl px-2 rotate-90 sm:rotate-0">&rarr;</div>

            {/* Step 5 */}
            <div className="flex-shrink-0 bg-gradient-to-br from-green-100 to-green-200 border border-green-300 rounded-xl px-4 py-3 text-center shadow-sm min-w-[150px]">
              <p className="text-xs font-semibold text-green-800">Delivery</p>
              <p className="text-[10px] text-green-600 mt-0.5">SMS / Voice / Web / Childcare / Voicemail</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white/50 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="size-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Live Demo</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Enter a symptom and location -- AI triage determines the right care type, then finds live providers</p>

          <form onSubmit={handleFindCare} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Symptom (e.g. rash, fever, earache)"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
              required
            />
            <input
              type="text"
              placeholder="Location (e.g. Sydney CBD 2000)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-400 to-pink-400 text-white hover:from-orange-500 hover:to-pink-500 px-6"
            >
              {loading ? "Searching..." : "Find care"}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>

          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {/* Triage Result Badge */}
          {triageInfo && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium px-4 py-1.5">
                Triage result: {triageInfo.care_type.toUpperCase()} needed ({triageInfo.urgency})
              </span>
            </div>
          )}

          {/* Results header */}
          {resultsHeader && (
            <p className="text-base font-semibold text-gray-800 mb-4">{resultsHeader}</p>
          )}

          {results !== null && results.length === 0 && (
            <p className="text-sm text-gray-500">No providers found. Try a different search.</p>
          )}

          {results && results.length > 0 && (
            <div>
              {/* ED Comparison Banner */}
              {edComparison && (
                <div className="mb-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-3 flex items-center gap-3">
                  <span className="text-lg">🏥</span>
                  <p className="text-sm font-medium">
                    Nearest ED: {edName} -- est. {edWait} wait
                  </p>
                </div>
              )}

              {/* Bulk Billing Toggle */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setBulkBillingOnly(!bulkBillingOnly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    bulkBillingOnly ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      bulkBillingOnly ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">Show bulk billing only</span>
              </div>

              {filteredResults && filteredResults.length === 0 && (
                <p className="text-sm text-gray-500 mb-4">No bulk-billing providers found in these results.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(filteredResults || []).slice(0, 6).map((p, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    {/* ED comparison -- most prominent element */}
                    <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-3">
                      <p className="text-xs font-bold text-green-700">
                        This GP: {p.availability?.next_available || "available"} vs {edName}: est. {edWait} wait
                      </p>
                    </div>

                    <p className="font-medium text-sm text-gray-900">{p.name}</p>
                    {p.address && <p className="text-xs text-gray-500 mt-0.5">{p.address}</p>}
                    {p.availability?.next_available && (
                      <p className="text-xs text-green-600 font-medium mt-1.5">Next: {p.availability.next_available}</p>
                    )}
                    {p.availability?.distance_km != null && (
                      <p className="text-xs text-gray-400 mt-0.5">{p.availability.distance_km} km away</p>
                    )}

                    {/* Service tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.bulk_billing && (
                        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Bulk billing
                        </span>
                      )}
                      {(p.services || []).map((svc, j) => (
                        <span
                          key={j}
                          className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${getServiceColor(svc)}`}
                        >
                          {svc}
                        </span>
                      ))}
                    </div>

                    {/* Links */}
                    <div className="flex gap-2 mt-2">
                      {p.website && (
                        <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-500 underline">
                          Website
                        </a>
                      )}
                      {p.google_maps_url && (
                        <a href={p.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-500 underline">
                          Directions
                        </a>
                      )}
                      {p.availability?.profile_url && (
                        <a href={p.availability.profile_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-500 underline">
                          Book
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Send Live SMS */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white/50 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <Send className="size-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Send Live SMS</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Send a real SMS with triage results to your phone</p>

          <form onSubmit={handleSendSms} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="tel"
              placeholder="Phone (+61 4XX XXX XXX)"
              value={smsPhone}
              onChange={(e) => setSmsPhone(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
              required
            />
            <input
              type="text"
              placeholder="Symptom (e.g. sore throat, headache)"
              value={smsSymptom}
              onChange={(e) => setSmsSymptom(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
              required
            />
            <Button
              type="submit"
              disabled={smsStatus === "sending"}
              className="bg-gradient-to-r from-orange-400 to-pink-400 text-white hover:from-orange-500 hover:to-pink-500 px-6"
            >
              {smsStatus === "sending" ? "Sending..." : "Send SMS"}
              {smsStatus !== "sending" && <Send className="size-4" />}
            </Button>
          </form>

          {smsStatus === "sent" && (
            <p className="text-sm text-green-600 font-medium mb-4">SMS sent! Check your phone.</p>
          )}
          {smsStatus === "error" && (
            <p className="text-sm text-red-500 mb-4">{smsError}</p>
          )}

          {/* SMS reply bubble */}
          {smsReply && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Reply that was sent:</p>
              <div className="max-w-sm mx-auto bg-gray-100 rounded-2xl p-4 border border-gray-200">
                {/* Phone frame */}
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">LH</div>
                    <span className="text-xs font-medium text-gray-700">Little Help</span>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-orange-50 border border-orange-100 rounded-xl rounded-tl-sm px-3 py-2 max-w-[280px]">
                      <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{smsReply}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pitch Quote */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="relative">
          <Shield className="size-8 text-orange-300 mx-auto mb-4" />
          <blockquote className="text-lg sm:text-xl font-medium text-gray-700 italic leading-relaxed">
            &ldquo;We don&rsquo;t ask Australians to download another app. We meet them at the exact moment the system currently fails them.&rdquo;
          </blockquote>
          <div className="mt-6 h-1 w-24 mx-auto bg-gradient-to-r from-orange-400 to-pink-400 rounded-full" />
        </div>
      </section>
    </div>
  )
}
