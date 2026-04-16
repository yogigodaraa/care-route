"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, PhoneOff } from "lucide-react";
import Vapi from "@vapi-ai/web";

import { cn } from "@/lib/utils";

interface TriageResult {
  careType: "gp" | "ed" | "pharmacy" | "clinic";
  urgency: "emergency" | "urgent" | "routine" | "low";
  summary: string;
}

interface VapiWidgetProps {
  apiKey: string;
  assistantId: string;
  config?: Record<string, unknown>;
  className?: string;
  onTriageResult?: (result: TriageResult) => void;
  onCallEnd?: () => void;
}

// Parse the AI's conversation to determine what care type it recommended
function parseTriageFromMessages(messages: string[]): TriageResult | null {
  // Look through messages from newest to oldest for care routing keywords
  const allText = messages.join(" ").toLowerCase();

  // Emergency keywords
  if (/\b(emergency|call\s*000|triple\s*zero|ambulance|go\s*to\s*(the\s*)?ed|emergency\s*department|a&e|immediately)\b/.test(allText)) {
    return { careType: "ed", urgency: "emergency", summary: "Seek emergency care" };
  }

  // Pharmacy keywords
  if (/\b(pharmacy|chemist|pharmacist|over[- ]the[- ]counter|otc)\b/.test(allText) && !/\b(gp|doctor|emergency)\b/.test(allText)) {
    return { careType: "pharmacy", urgency: "low", summary: "Visit a pharmacy" };
  }

  // Clinic / urgent care keywords
  if (/\b(urgent\s*care|walk[- ]in\s*clinic|after[- ]hours\s*clinic)\b/.test(allText)) {
    return { careType: "clinic", urgency: "urgent", summary: "Visit an urgent care clinic" };
  }

  // GP keywords (most common outcome)
  if (/\b(gp|general\s*practitioner|doctor|see\s*a\s*doctor|medical\s*cent(re|er)|appointment|book)\b/.test(allText)) {
    return { careType: "gp", urgency: "routine", summary: "See a GP today" };
  }

  return null;
}

export default function VapiWidget({
  apiKey,
  assistantId,
  config = {},
  className,
  onTriageResult,
  onCallEnd,
}: VapiWidgetProps) {
  const vapiRef = useRef<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<string[]>([]);
  const isConfigured = Boolean(apiKey && assistantId);
  const waveformHeights = [16, 22, 18, 26, 14, 24, 28, 18];

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const vapiInstance = new Vapi(apiKey);
    vapiRef.current = vapiInstance;

    vapiInstance.on("call-start", () => {
      setError(null);
      setIsConnected(true);
    });

    vapiInstance.on("call-end", () => {
      setIsConnected(false);
      setIsSpeaking(false);

      // Parse accumulated messages to determine triage result
      const result = parseTriageFromMessages(messagesRef.current);
      if (result && onTriageResult) {
        onTriageResult(result);
      } else if (onCallEnd) {
        onCallEnd();
      }
      messagesRef.current = [];
    });

    vapiInstance.on("message", (msg: any) => {
      // Capture assistant messages for triage parsing
      if (msg?.type === "transcript" && msg?.role === "assistant" && msg?.transcript) {
        messagesRef.current.push(msg.transcript);
      }
      // Also capture function calls from the assistant
      if (msg?.type === "function-call" || msg?.functionCall) {
        const fnCall = msg.functionCall || msg;
        const fnName = fnCall?.name || "";
        const fnArgs = fnCall?.parameters || fnCall?.arguments || {};

        // If the AI calls a routing function, use it directly
        if (fnName === "route_patient" || fnName === "triage_result" || fnName === "recommend_care") {
          const careType = fnArgs.care_type || fnArgs.careType || "gp";
          const urgency = fnArgs.urgency || "routine";
          const summary = fnArgs.summary || fnArgs.message || `See a ${careType}`;
          if (onTriageResult) {
            onTriageResult({ careType, urgency, summary });
          }
        }
      }
    });

    vapiInstance.on("speech-start", () => {
      setIsSpeaking(true);
    });

    vapiInstance.on("speech-end", () => {
      setIsSpeaking(false);
    });

    vapiInstance.on("error", (error) => {
      console.error("Vapi error:", error);
      setError("Unable to start voice call");
    });

    return () => {
      vapiInstance.stop();
      vapiRef.current = null;
    };
  }, [apiKey, isConfigured]);

  const startCall = () => {
    if (!vapiRef.current || !assistantId) {
      return;
    }

    setError(null);

    if (Object.keys(config).length > 0) {
      vapiRef.current.start(
        assistantId,
        config as Parameters<Vapi["start"]>[1],
      );
      return;
    }

    vapiRef.current.start(assistantId);
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  };

  return (
    <div className={cn("mb-6", className)}>
      {!isConnected ? (
        <div className="flex flex-col items-center">
          <button
            onClick={startCall}
            disabled={!isConfigured}
            className="relative flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="absolute h-52 w-52 rounded-full bg-orange-100 sm:h-64 sm:w-64" />
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-linear-to-br from-pink-400 to-orange-400 shadow-lg sm:h-48 sm:w-48">
              <Mic className="h-14 w-14 text-white sm:h-16 sm:w-16" />
            </div>
          </button>

          <div className="mt-6 flex items-end gap-2 sm:mt-8">
            {waveformHeights.map((height, index) => (
              <div
                key={index}
                className={cn(
                  "w-1 rounded-full",
                  index % 3 === 0
                    ? "bg-orange-400"
                    : index % 3 === 1
                      ? "bg-orange-300"
                      : "bg-pink-400"
                )}
                style={{
                  height,
                  animation: `bounceBar ${0.8 + index * 0.1}s infinite`,
                }}
              />
            ))}
          </div>

          {!isConfigured ? <p className="mt-4 text-sm text-[#c86f58]">Vapi not configured</p> : null}
          {error ? <p className="mt-2 text-sm text-[#c86f58]">{error}</p> : null}
        </div>
      ) : (
        <div className="w-full rounded-3xl border border-black/5 bg-white/80 p-5 text-left shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-3 w-3 rounded-full",
                  isSpeaking ? "animate-pulse bg-[#e07a5f]" : "bg-[#1f2622]",
                )}
              />
              <div>
                <p className="text-sm font-semibold text-[#1f2622]">
                  {isSpeaking ? "Assistant speaking" : "Listening..."}
                </p>
                <p className="text-xs text-[#6a716d]">
                  {isSpeaking ? "The assistant is responding." : "Speak to continue."}
                </p>
              </div>
            </div>
            <button
              onClick={endCall}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-[#1f2622] ring-1 ring-black/5"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              End call
            </button>
          </div>

          <div className="mt-6 flex items-end justify-center gap-2">
            {waveformHeights.map((height, index) => (
              <div
                key={index}
                className={cn(
                  "w-1 rounded-full",
                  index % 2 === 0 ? "bg-orange-400" : "bg-pink-400"
                )}
                style={{
                  height: height + 4,
                  animation: `bounceBar ${0.9 + index * 0.08}s infinite`,
                }}
              />
            ))}
          </div>

          {error ? <p className="mt-4 text-sm text-[#e07a5f]">{error}</p> : null}
        </div>
      )}

      <style>{`
        @keyframes bounceBar {
          0%, 100% { height: 10px; }
          50% { height: 28px; }
        }
      `}</style>
    </div>
  );
}
