"use client";

import { useState } from "react";
import { Mic, MessageSquare } from "lucide-react";
import VapiWidget from "@/components/vapi/Vapi";

interface TriageResult {
  careType: "gp" | "ed" | "pharmacy" | "clinic";
  urgency: "emergency" | "urgent" | "routine" | "low";
  summary: string;
}

interface HomeScreenProps {
  onAllGood: () => void;
  onSomethingsOff: () => void;
  onVoiceCheckIn: () => void;
  onTriageResult?: (result: TriageResult) => void;
  onCallEnd?: () => void;
  onTextTriage?: () => void;
}

export function HomeScreen({
  onTriageResult,
  onCallEnd,
  onTextTriage,
}: HomeScreenProps) {
  const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
  const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";
  const [mode, setMode] = useState<"choose" | "voice">("choose");

  if (mode === "voice") {
    return (
      <div className="relative h-dvh overflow-hidden bg-[#e9e1db]">
        <div className="h-24 w-full bg-gradient-to-r from-orange-400 to-pink-400 sm:h-28" />

        <div className="absolute left-4 top-28 h-28 w-28 rounded-full bg-pink-200/30 sm:left-6 sm:top-36 sm:h-36 sm:w-36" />
        <div className="absolute right-0 top-8 h-44 w-44 rounded-full bg-orange-200/30 sm:top-10 sm:h-56 sm:w-56" />
        <div className="absolute bottom-8 left-0 h-36 w-36 rounded-full bg-pink-100/30 sm:bottom-10 sm:h-44 sm:w-44" />
        <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-orange-100/30 sm:h-56 sm:w-56" />

        <div className="relative z-10 flex h-[calc(100dvh-6rem)] flex-col items-center px-6 pt-10 text-center sm:h-[calc(100dvh-7rem)] sm:pt-16">
          <h1 className="text-3xl font-bold text-gray-700">Tell me what's wrong</h1>
          <p className="mt-2 max-w-xs text-sm text-gray-500 sm:text-base">
            Tap the mic to start talking
          </p>

          <VapiWidget
            apiKey={vapiPublicKey}
            assistantId={vapiAssistantId}
            className="mt-10 mb-0 sm:mt-12"
            onTriageResult={onTriageResult}
            onCallEnd={onCallEnd}
          />

          <div className="mt-6 rounded-full bg-orange-100 px-6 py-3 text-sm font-medium text-orange-400 sm:mt-8">
            Voice enabled
          </div>

          <button
            onClick={() => setMode("choose")}
            className="mt-4 text-xs text-gray-400 underline hover:text-gray-500"
          >
            Back to options
          </button>

          <SimulateCallButtons onTriageResult={onTriageResult} />
        </div>
      </div>
    );
  }

  // Choose mode screen
  return (
    <div className="relative h-dvh overflow-hidden bg-[#e9e1db]">
      <div className="h-24 w-full bg-gradient-to-r from-orange-400 to-pink-400 sm:h-28" />

      <div className="absolute left-4 top-28 h-28 w-28 rounded-full bg-pink-200/30 sm:left-6 sm:top-36 sm:h-36 sm:w-36" />
      <div className="absolute right-0 top-8 h-44 w-44 rounded-full bg-orange-200/30 sm:top-10 sm:h-56 sm:w-56" />
      <div className="absolute bottom-8 left-0 h-36 w-36 rounded-full bg-pink-100/30 sm:bottom-10 sm:h-44 sm:w-44" />
      <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-orange-100/30 sm:h-56 sm:w-56" />

      <div className="relative z-10 flex h-[calc(100dvh-6rem)] flex-col items-center px-6 pt-10 text-center sm:h-[calc(100dvh-7rem)] sm:pt-16">
        <h1 className="text-3xl font-bold text-gray-700">Hey there!</h1>
        <p className="mt-2 max-w-xs text-sm text-gray-500 sm:text-base">
          How would you like to tell us what's going on?
        </p>

        <div className="mt-12 flex gap-6 sm:mt-16">
          {/* Voice button */}
          <button
            onClick={() => setMode("voice")}
            className="group flex flex-col items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-400 shadow-lg shadow-orange-200/50 transition-shadow group-hover:shadow-xl group-hover:shadow-orange-300/50 sm:h-28 sm:w-28">
              <Mic className="h-10 w-10 text-white sm:h-12 sm:w-12" />
            </div>
            <span className="text-sm font-semibold text-gray-600">Voice</span>
            <span className="text-xs text-gray-400">Talk to me</span>
          </button>

          {/* Text button */}
          <button
            onClick={onTextTriage}
            className="group flex flex-col items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 shadow-lg shadow-blue-200/50 transition-shadow group-hover:shadow-xl group-hover:shadow-blue-300/50 sm:h-28 sm:w-28">
              <MessageSquare className="h-10 w-10 text-white sm:h-12 sm:w-12" />
            </div>
            <span className="text-sm font-semibold text-gray-600">Text</span>
            <span className="text-xs text-gray-400">Tap to answer</span>
          </button>
        </div>

        <div className="mt-10 rounded-full bg-white/50 px-6 py-3 text-xs text-gray-400 sm:mt-12">
          Pick what feels easier right now
        </div>
      </div>
    </div>
  );
}

function SimulateCallButtons({
  onTriageResult,
}: {
  onTriageResult?: (result: TriageResult) => void;
}) {
  const [simulating, setSimulating] = useState<string | null>(null);

  const simulate = (label: string, result: TriageResult) => {
    setSimulating(label);
    setTimeout(() => {
      setSimulating(null);
      onTriageResult?.(result);
    }, 2000);
  };

  if (simulating) {
    return (
      <div className="mt-4 flex flex-col items-center gap-1">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
        <span className="text-xs text-gray-400">Simulating call...</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-1">
      <span className="text-xs text-gray-400">Or simulate a voice call</span>
      <div className="flex gap-3">
        <button
          type="button"
          className="text-xs text-gray-400 underline hover:text-gray-500"
          onClick={() =>
            simulate("gp", { careType: "gp", urgency: "routine", summary: "See a GP today" })
          }
        >
          Simulate: GP
        </button>
        <button
          type="button"
          className="text-xs text-gray-400 underline hover:text-gray-500"
          onClick={() =>
            simulate("ed", { careType: "ed", urgency: "emergency", summary: "Go to ED now" })
          }
        >
          Simulate: Emergency
        </button>
      </div>
    </div>
  );
}
