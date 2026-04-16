"use client"

import { Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceQuestionScreenProps {
  question: string
  transcript?: string
  onStop: () => void
  onAnswer: () => void
}

export function VoiceQuestionScreen({ question, transcript, onStop, onAnswer }: VoiceQuestionScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Question */}
        <h1 className="text-2xl font-semibold text-center mb-8 text-foreground leading-relaxed">
          {question}
        </h1>

        {/* Listening Indicator */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="flex items-end gap-1 h-8">
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "60%", animationDelay: "0ms" }} />
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "100%", animationDelay: "150ms" }} />
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "80%", animationDelay: "450ms" }} />
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "50%", animationDelay: "600ms" }} />
            </div>
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <p className="text-muted-foreground text-center italic px-4 animate-in fade-in duration-300">
            &ldquo;{transcript}&rdquo;
          </p>
        )}

        {/* Demo: Tap to answer */}
        <Button
          onClick={onAnswer}
          variant="ghost"
          className="mt-8 text-muted-foreground"
        >
          Tap to simulate answer
        </Button>
      </div>

      {/* Stop Button */}
      <Button
        onClick={onStop}
        variant="outline"
        className="w-full h-14 rounded-2xl text-lg border-2 border-muted hover:bg-muted/50 text-muted-foreground"
      >
        <Square className="w-5 h-5 mr-2 fill-current" />
        Stop listening
      </Button>
    </div>
  )
}
