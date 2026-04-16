"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Thermometer,
  Brain,
  Bone,
  Pill,
  AlertTriangle,
  Activity,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TriageResult {
  careType: "gp" | "ed" | "pharmacy" | "clinic";
  urgency: "emergency" | "urgent" | "routine" | "low";
  summary: string;
}

interface TextTriageScreenProps {
  onBack: () => void;
  onTriageResult: (result: TriageResult) => void;
}

interface QuestionOption {
  id: string;
  label: string;
  weight: string;
}

interface Question {
  id: string;
  text: string;
  subtitle?: string;
  options: QuestionOption[];
}

type Step = "symptom" | "questions" | "evaluating";

const SYMPTOMS = [
  { id: "fever", label: "Fever / Temperature", icon: Thermometer, color: "bg-red-50 border-red-200 text-red-700", activeColor: "ring-red-400" },
  { id: "pain", label: "Pain / Injury", icon: Bone, color: "bg-orange-50 border-orange-200 text-orange-700", activeColor: "ring-orange-400" },
  { id: "stomach", label: "Stomach / Vomiting", icon: Pill, color: "bg-green-50 border-green-200 text-green-700", activeColor: "ring-green-400" },
  { id: "breathing", label: "Breathing / Chest", icon: Activity, color: "bg-blue-50 border-blue-200 text-blue-700", activeColor: "ring-blue-400" },
  { id: "rash", label: "Rash / Skin Issue", icon: AlertTriangle, color: "bg-purple-50 border-purple-200 text-purple-700", activeColor: "ring-purple-400" },
  { id: "mental", label: "Anxiety / Feeling Low", icon: Brain, color: "bg-cyan-50 border-cyan-200 text-cyan-700", activeColor: "ring-cyan-400" },
];

export function TextTriageScreen({ onBack, onTriageResult }: TextTriageScreenProps) {
  const [step, setStep] = useState<Step>("symptom");
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = questions.length + 1; // symptom pick + each question
  const currentStep = step === "symptom" ? 1 : 1 + currentQ + 1;
  const progress = step === "evaluating" ? 100 : (currentStep / totalSteps) * 100;

  // Fetch questions when symptom is selected
  useEffect(() => {
    if (!selectedSymptom) return;
    setLoading(true);
    setError(null);

    fetch(`/api/triage?symptom_id=${selectedSymptom}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load questions");
        return res.json();
      })
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setStep("questions");
          setCurrentQ(0);
          setAnswers({});
        } else {
          throw new Error("No questions returned");
        }
      })
      .catch(() => {
        setError("Couldn't load questions. Please try again.");
        setStep("symptom");
        setSelectedSymptom(null);
      })
      .finally(() => setLoading(false));
  }, [selectedSymptom]);

  const handleSymptomSelect = (id: string) => {
    setSelectedSymptom(id);
  };

  const handleAnswer = (questionId: string, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      // Next question
      setTimeout(() => setCurrentQ((q) => q + 1), 200);
    } else {
      // All answered — evaluate
      setStep("evaluating");
      evaluateAnswers(newAnswers);
    }
  };

  const evaluateAnswers = (finalAnswers: Record<string, string>) => {
    fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symptom_id: selectedSymptom,
        answers: finalAnswers,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Evaluation failed");
        return res.json();
      })
      .then((data) => {
        const careMap: Record<string, "gp" | "ed" | "pharmacy" | "clinic"> = {
          gp: "gp",
          ed: "ed",
          pharmacy: "pharmacy",
          clinic: "clinic",
        };
        setTimeout(() => {
          onTriageResult({
            careType: careMap[data.care_type] || "gp",
            urgency: data.urgency || "routine",
            summary: data.message || "See a GP for assessment.",
          });
        }, 1500);
      })
      .catch(() => {
        // Fallback — send to GP
        setTimeout(() => {
          onTriageResult({
            careType: "gp",
            urgency: "routine",
            summary: "See a GP for assessment.",
          });
        }, 1000);
      });
  };

  const handleBack = () => {
    if (step === "questions" && currentQ > 0) {
      setCurrentQ((q) => q - 1);
      // Remove last answer
      const lastQ = questions[currentQ];
      if (lastQ) {
        const newAnswers = { ...answers };
        delete newAnswers[lastQ.id];
        setAnswers(newAnswers);
      }
    } else if (step === "questions" && currentQ === 0) {
      setStep("symptom");
      setSelectedSymptom(null);
      setQuestions([]);
    } else {
      onBack();
    }
  };

  const symptomMeta = SYMPTOMS.find((s) => s.id === selectedSymptom);

  return (
    <div className="relative h-dvh overflow-hidden bg-[#e9e1db]">
      <div className="h-24 w-full bg-gradient-to-r from-blue-400 to-indigo-400 sm:h-28" />

      <div className="absolute left-4 top-28 h-28 w-28 rounded-full bg-blue-200/20 sm:left-6 sm:top-36 sm:h-36 sm:w-36" />
      <div className="absolute right-0 top-8 h-44 w-44 rounded-full bg-indigo-200/20 sm:top-10 sm:h-56 sm:w-56" />

      <div className="relative z-10 flex h-[calc(100dvh-6rem)] flex-col px-6 pt-6 sm:h-[calc(100dvh-7rem)] sm:pt-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {step !== "evaluating" && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full bg-white/50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-700">
              {step === "symptom" ? "Quick Check" : step === "evaluating" ? "Analysing..." : symptomMeta?.label || "Questions"}
            </h2>
          </div>
          {step === "questions" && (
            <span className="text-xs text-gray-400 font-medium">
              {currentQ + 1} / {questions.length}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-gray-200/50 mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step 1: Symptom selection */}
        {step === "symptom" && !loading && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-700 mb-1">What's going on?</h3>
            <p className="text-sm text-gray-500 mb-6">Tap the closest match</p>
            <div className="grid grid-cols-2 gap-3">
              {SYMPTOMS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSymptomSelect(s.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 hover:scale-[1.02] active:scale-95 ${s.color}`}
                  >
                    <Icon className="w-7 h-7" />
                    <span className="text-sm font-medium text-center leading-tight">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading questions */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm text-gray-500">Loading questions...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" onClick={() => { setError(null); setStep("symptom"); }}>
              Try again
            </Button>
          </div>
        )}

        {/* Dynamic questions — one at a time */}
        {step === "questions" && !loading && questions[currentQ] && (
          <div key={questions[currentQ].id} className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-700 mb-1">
              {questions[currentQ].text}
            </h3>
            {questions[currentQ].subtitle && (
              <p className="text-sm text-gray-500 mb-4 italic">
                {questions[currentQ].subtitle}
              </p>
            )}
            {!questions[currentQ].subtitle && <div className="mb-4" />}

            <div className="flex flex-col gap-3">
              {questions[currentQ].options.map((opt) => {
                const isSelected = answers[questions[currentQ].id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(questions[currentQ].id, opt.id)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                        : opt.weight === "emergency"
                          ? "border-red-200 bg-red-50/50 text-gray-700 hover:border-red-300"
                          : "border-gray-200 bg-white/80 text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm font-medium leading-snug">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Evaluating */}
        {step === "evaluating" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-700">Analysing your answers</h3>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              Finding the best care option for you based on clinical guidelines...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
