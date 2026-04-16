"use client"

import { Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceModeScreenProps {
  onStop: () => void
}

export function VoiceModeScreen({ onStop }: VoiceModeScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Animated Mic Indicator */}
        <div className="relative mb-12">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/40 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary animate-ping" />
              </div>
            </div>
          </div>
          
          {/* Sound Wave Rings */}
          <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: "1.5s" }} />
          <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
        </div>

        {/* Text */}
        <h1 className="text-2xl font-semibold text-center mb-3 text-foreground">
          Tell me what&apos;s going on
        </h1>
        
        <p className="text-center text-muted-foreground text-lg mb-2">
          I&apos;ll ask a few quick questions
        </p>

        <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-muted/50">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Listening...</span>
        </div>
      </div>

      {/* Stop Button */}
      <Button
        onClick={onStop}
        variant="outline"
        className="w-full h-14 rounded-2xl text-lg border-2 border-destructive/30 hover:bg-destructive/10 text-destructive"
      >
        <Square className="w-5 h-5 mr-2 fill-current" />
        Stop listening
      </Button>
    </div>
  )
}
