export default function ApiDocsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#e9e1db" }}>
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">+</span>
            <h1 className="text-4xl font-bold tracking-tight">Little Help API</h1>
          </div>
          <p className="text-2xl font-semibold mb-2">Care Routing Engine</p>
          <p className="text-lg opacity-90">One API powers every interception channel</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium">REST API</span>
            <span className="bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium">Webhooks</span>
            <span className="bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium">Embeddable Widgets</span>
            <span className="bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium">AI Triage</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Architecture overview */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">How It Works</h2>
          <p className="text-gray-600 text-lg mb-6 max-w-3xl">
            Little Help sits between patients and the healthcare system. Our API intercepts care-seeking moments — a parent texting about a sick child, a GP voicemail after hours, a childcare centre&apos;s fever alert — and routes each one to the right, lowest-acuity care option in real time.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Intercept", desc: "Patient triggers a care event via any channel" },
              { step: "2", title: "Triage", desc: "AI assesses urgency and care needs" },
              { step: "3", title: "Route", desc: "Match to nearest available provider with live availability" },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white flex items-center justify-center font-bold mb-3">{item.step}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-8">API Endpoints</h2>
          <div className="space-y-8">

            <EndpointCard
              method="POST"
              path="/api/find-provider"
              description="Find nearby healthcare providers with live availability. Supports filtering by care type (GP, pharmacy, after-hours clinic, ED), bulk billing status, and distance. Returns real-time appointment slots."
              request={`fetch("/api/find-provider", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    latitude: -33.8688,
    longitude: 151.2093,
    careType: "gp",
    bulkBilling: true,
    radius: 5000
  })
})`}
              response={`{
  "providers": [
    {
      "name": "Sydney Medical Centre",
      "address": "123 George St, Sydney NSW",
      "distance": "1.2 km",
      "bulkBilling": true,
      "nextAvailable": "Today 3:15 PM",
      "phone": "02 9000 1234",
      "bookingUrl": "https://..."
    }
  ],
  "count": 8,
  "searchRadius": 5000
}`}
            />

            <EndpointCard
              method="POST"
              path="/api/whatsapp"
              description="Webhook receiver for incoming SMS and WhatsApp messages. Processes patient messages through AI triage, assesses urgency, and returns appropriate care guidance. Connects to Twilio for message delivery."
              request={`// Twilio webhook payload (auto-sent)
POST /api/whatsapp
Content-Type: application/x-www-form-urlencoded

From=whatsapp:+61400000000
&Body=My 8 month old has had a fever since this morning, 38.5 degrees
&MessageSid=SM1234567890`}
              response={`{
  "triageResult": {
    "urgency": "moderate",
    "recommendation": "See a GP today",
    "reasoning": "Fever of 38.5 in infant under 12mo warrants same-day GP review",
    "selfCare": [
      "Keep fluids up",
      "Paracetamol per weight-based dosing",
      "Monitor for rash or lethargy"
    ]
  },
  "providersOffered": 3,
  "messageSent": true
}`}
            />

            <EndpointCard
              method="POST"
              path="/api/whatsapp/send"
              description="Send an outbound triage message to a patient via WhatsApp or SMS. Used for proactive follow-ups, appointment reminders, or care navigation messages."
              request={`fetch("/api/whatsapp/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "+61400000000",
    message: "Hi Sarah, your GP Dr Chen at Newtown Medical has a bulk-billed appointment available at 4:30 PM today. Reply YES to book."
  })
})`}
              response={`{
  "success": true,
  "messageSid": "SM9876543210",
  "channel": "whatsapp"
}`}
            />

            <EndpointCard
              method="GET"
              path="/api/voicemail-redirect"
              description="GP voicemail interception endpoint. When a GP practice is closed or lines are busy, this redirects callers to alternative care options instead of leaving a voicemail that won't be heard until tomorrow."
              request={`GET /api/voicemail-redirect?practice_id=newtown-medical
    &caller=+61400000000
    &reason=after-hours`}
              response={`{
  "redirect": true,
  "message": "Newtown Medical is closed. Based on your area, here are available options now:",
  "alternatives": [
    {
      "type": "after-hours-clinic",
      "name": "Inner West After Hours",
      "distance": "2.1 km",
      "waitTime": "~25 min",
      "bulkBilling": true
    },
    {
      "type": "telehealth",
      "name": "13SICK National Home Doctor",
      "available": "now",
      "bulkBilling": true
    }
  ],
  "smsSent": true
}`}
            />

            <EndpointCard
              method="POST"
              path="/api/childcare-alert"
              description="Childcare sick-child notification endpoint. When a childcare centre identifies a sick child, this alerts the parent with triage guidance and nearby provider options — preventing a panicked drive straight to ED."
              request={`fetch("/api/childcare-alert", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    centreId: "tiny-tots-newtown",
    childName: "Mia",
    parentPhone: "+61400000000",
    symptoms: ["fever", "runny_nose", "irritable"],
    temperature: 38.2,
    onsetTime: "10:30 AM"
  })
})`}
              response={`{
  "alertSent": true,
  "triageResult": {
    "urgency": "low",
    "recommendation": "GP within 24 hours if symptoms persist",
    "edNeeded": false
  },
  "parentNotified": true,
  "nearbyProviders": [
    {
      "name": "Newtown Medical Centre",
      "nextAvailable": "Today 2:45 PM",
      "bulkBilling": true,
      "distance": "800m from childcare centre"
    }
  ]
}`}
            />

            <EndpointCard
              method="GET"
              path="/dummy-phase2"
              description="Phase 2 advanced triage endpoint (Python backend). Runs a multi-step clinical reasoning model for complex presentations, returning structured triage with confidence scores and differential considerations."
              request={`GET http://localhost:8000/dummy-phase2
    ?symptoms=fever,vomiting,lethargy
    &age_months=6
    &duration_hours=12`}
              response={`{
  "phase": 2,
  "triage": {
    "urgencyScore": 7,
    "category": "urgent-gp",
    "confidence": 0.82,
    "reasoning": "Combination of fever + vomiting + lethargy in 6mo infant requires prompt GP assessment to rule out serious bacterial infection",
    "redFlags": ["age < 12 months", "lethargy"],
    "differentials": [
      "Viral gastroenteritis",
      "UTI",
      "Otitis media"
    ]
  }
}`}
            />
          </div>
        </section>

        {/* Integration Examples */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Integration Examples</h2>
          <p className="text-gray-600 mb-8 text-lg">Embed care routing into any existing healthcare touchpoint.</p>
          <div className="grid md:grid-cols-2 gap-6">

            <IntegrationCard
              title="GP Practice Website"
              tag="Widget"
              description="Embed a booking widget that calls find-provider. When your practice is full, patients see same-day alternatives nearby — not ED."
              code={`<!-- Drop into any GP website -->
<script src="https://littlehelp.au/widget.js"
  data-practice="newtown-medical"
  data-care-types="gp,pharmacy,telehealth"
  data-bulk-billing="true">
</script>`}
            />

            <IntegrationCard
              title="Childcare Management System"
              tag="Webhook"
              description="Connect your childcare app to fire sick-child alerts automatically. Parents get triage + nearby GP options instead of heading to ED."
              code={`// In your childcare CMS webhook settings:
Webhook URL: https://littlehelp.au/api/childcare-alert
Method: POST
Trigger: sick_child_logged
Headers: {
  "Authorization": "Bearer ck_live_xxxx",
  "Content-Type": "application/json"
}`}
            />

            <IntegrationCard
              title="Health Insurance App"
              tag="Embedded API"
              description="Embed the provider finder with bulk billing filter into your member app. Help members find in-network care before they default to ED."
              code={`// React Native integration
import { LittleHelpProvider } from '@littlehelp/sdk';

<LittleHelpProvider
  apiKey="ins_live_xxxx"
  filters={{
    bulkBilling: true,
    network: "medibank-preferred",
    maxDistance: 10000
  }}
  onProviderSelected={(provider) => {
    navigation.navigate('Booking', { provider });
  }}
/>`}
            />

            <IntegrationCard
              title="WhatsApp Business"
              tag="Webhook"
              description="Set up SMS/WhatsApp triage in minutes. Patients text symptoms, AI triages, and they get provider options — all without an app download."
              code={`// Twilio WhatsApp webhook config
{
  "friendlyName": "LittleHelp Triage",
  "incomingRequest": {
    "url": "https://littlehelp.au/api/whatsapp",
    "method": "POST"
  },
  "statusCallback": {
    "url": "https://littlehelp.au/api/whatsapp/status"
  }
}`}
            />
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Pricing</h2>
          <p className="text-gray-600 mb-8 text-lg">Aligned with the health system — we only win when ED presentations are avoided.</p>
          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-green-200">
              <div className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">Community</div>
              <div className="text-3xl font-bold text-gray-800 mb-1">Free</div>
              <p className="text-gray-500 text-sm mb-6">For GPs and childcare centres</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-green-500 font-bold">&#10003;</span> Voicemail redirect</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">&#10003;</span> Childcare sick-child alerts</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">&#10003;</span> Provider finder widget</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">&#10003;</span> WhatsApp triage (up to 500 msgs/mo)</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">&#10003;</span> Bulk billing filter</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-orange-300 ring-2 ring-orange-200">
              <div className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-2">Pro</div>
              <div className="text-3xl font-bold text-gray-800 mb-1">$10 &ndash; $20</div>
              <p className="text-gray-500 text-sm mb-6">Per successful ED diversion</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-orange-500 font-bold">&#10003;</span> Everything in Community</li>
                <li className="flex gap-2"><span className="text-orange-500 font-bold">&#10003;</span> After-hours clinic routing</li>
                <li className="flex gap-2"><span className="text-orange-500 font-bold">&#10003;</span> Insurance network matching</li>
                <li className="flex gap-2"><span className="text-orange-500 font-bold">&#10003;</span> Analytics dashboard</li>
                <li className="flex gap-2"><span className="text-orange-500 font-bold">&#10003;</span> Unlimited messages</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-sm text-white">
              <div className="text-sm font-semibold text-orange-300 uppercase tracking-wide mb-2">The Comparison</div>
              <div className="text-3xl font-bold mb-1">$500 &ndash; $800</div>
              <p className="text-gray-400 text-sm mb-6">Cost per avoidable ED presentation</p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2"><span className="text-red-400 font-bold">&times;</span> 4+ hour average wait</li>
                <li className="flex gap-2"><span className="text-red-400 font-bold">&times;</span> Overcrowded departments</li>
                <li className="flex gap-2"><span className="text-red-400 font-bold">&times;</span> Stressed families</li>
                <li className="flex gap-2"><span className="text-red-400 font-bold">&times;</span> Resources pulled from true emergencies</li>
                <li className="flex gap-2"><span className="text-orange-300 font-bold">~</span> 40% of paediatric ED visits are avoidable</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="text-center pb-8">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-3">Ready to intercept unnecessary ED visits?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Every integration point is a chance to catch a parent before they drive to ED. The API is the engine — your platform is the channel.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="bg-white text-orange-600 font-semibold px-8 py-3 rounded-full">Get API Key</span>
              <span className="bg-white/20 backdrop-blur font-semibold px-8 py-3 rounded-full border border-white/40">View on GitHub</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  description,
  request,
  response,
}: {
  method: string;
  path: string;
  description: string;
  request: string;
  response: string;
}) {
  const methodColor = method === "GET" ? "bg-blue-500" : "bg-green-500";
  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className={`${methodColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>{method}</span>
          <code className="text-sm font-mono text-gray-800 font-semibold">{path}</code>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-orange-100">
        <div className="p-5 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Example Request</p>
          <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{request}</pre>
        </div>
        <div className="p-5 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Example Response</p>
          <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{response}</pre>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  title,
  tag,
  description,
  code,
}: {
  title: string;
  tag: string;
  description: string;
  code: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{tag}</span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="p-5 bg-gray-50 border-t border-orange-100">
        <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{code}</pre>
      </div>
    </div>
  );
}
