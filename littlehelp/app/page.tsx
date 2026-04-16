"use client"

import { useState } from "react"
import { HomeScreen } from "@/components/baby-health/home-screen"
import { TextTriageScreen } from "@/components/baby-health/text-triage-screen"
import { AllGoodScreen } from "@/components/baby-health/all-good-screen"
import { ResultScreen } from "@/components/baby-health/result-screen"
import { UrgentScreen } from "@/components/baby-health/urgent-screen"
import { ProvidersScreen } from "@/components/baby-health/providers-screen"

type Screen = "home" | "text-triage" | "all-good" | "result" | "urgent" | "providers"

export default function BabyHealthApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")
  const [careType, setCareType] = useState<"gp" | "ed" | "pharmacy" | "clinic">("gp")

  const handleStartOver = () => {
    setCurrentScreen("home")
    setCareType("gp")
  }

  const handleTriageResult = (result: { careType: "gp" | "ed" | "pharmacy" | "clinic"; urgency: string }) => {
    setCareType(result.careType);
    if (result.urgency === "emergency") {
      setCurrentScreen("urgent");
    } else {
      setCurrentScreen("providers");
    }
  };

  return (
    <main className="min-h-screen max-w-md mx-auto bg-background shadow-2xl">
      {currentScreen === "home" && (
        <HomeScreen
          onAllGood={() => setCurrentScreen("all-good")}
          onSomethingsOff={() => {}}
          onVoiceCheckIn={() => {}}
          onTriageResult={handleTriageResult}
          onCallEnd={() => {
            setCareType("gp");
            setCurrentScreen("providers");
          }}
          onTextTriage={() => setCurrentScreen("text-triage")}
        />
      )}

      {currentScreen === "text-triage" && (
        <TextTriageScreen
          onBack={handleStartOver}
          onTriageResult={handleTriageResult}
        />
      )}

      {currentScreen === "all-good" && (
        <AllGoodScreen onDone={handleStartOver} />
      )}

      {currentScreen === "result" && (
        <ResultScreen
          onFindGP={() => { setCareType("gp"); setCurrentScreen("providers") }}
          onFindPharmacy={() => { setCareType("pharmacy"); setCurrentScreen("providers") }}
          onCallClinic={() => { setCareType("clinic"); setCurrentScreen("providers") }}
          onAskAgain={handleStartOver}
        />
      )}

      {currentScreen === "urgent" && (
        <UrgentScreen
          onFindEmergency={() => { setCareType("ed"); setCurrentScreen("providers") }}
          onCallEmergency={() => window.open("tel:000")}
          onHome={handleStartOver}
        />
      )}

      {currentScreen === "providers" && (
        <ProvidersScreen
          careType={careType}
          onBack={() => setCurrentScreen(careType === "ed" ? "urgent" : "result")}
          onHome={handleStartOver}
        />
      )}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 py-2 px-4 text-center z-50 max-w-md mx-auto">
        <p className="text-[10px] text-gray-400">
          Care navigation only — not medical diagnosis. In an emergency, call <a href="tel:000" className="underline font-medium">000</a> immediately.
        </p>
      </div>
    </main>
  )
}
