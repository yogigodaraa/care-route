"use client"

import { useState } from "react"
import { Check, Moon, Baby, Home } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AllGoodScreenProps {
  onDone: () => void
}

export function AllGoodScreen({ onDone }: AllGoodScreenProps) {
  const [sleep, setSleep] = useState<"good" | "not-great" | null>(null)
  const [feeding, setFeeding] = useState<"normal" | "less" | null>(null)

  return (
    <div className="relative flex flex-col min-h-screen bg-success/10 p-6">
      <Button variant="ghost" size="icon" onClick={onDone} className="absolute top-4 left-4 rounded-full">
        <Home className="w-5 h-5" />
      </Button>
      {/* Success Icon */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-success/30 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <div className="w-16 h-16 rounded-full bg-success/50 flex items-center justify-center">
            <Check className="w-10 h-10 text-success-foreground" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-3 text-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          Everything sounds normal today
        </h1>
        
        <p className="text-center text-muted-foreground text-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          You&apos;re doing great. 💚
        </p>
      </div>

      {/* Quick Taps */}
      <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <p className="text-sm text-muted-foreground text-center">Quick check (optional)</p>
        
        <Card className="border-0 bg-card/80 shadow-sm backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Sleep</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sleep === "good" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSleep("good")}
                  className="rounded-full"
                >
                  Good
                </Button>
                <Button
                  variant={sleep === "not-great" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSleep("not-great")}
                  className="rounded-full"
                >
                  Not great
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/80 shadow-sm backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Baby className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Feeding</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={feeding === "normal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeeding("normal")}
                  className="rounded-full"
                >
                  Normal
                </Button>
                <Button
                  variant={feeding === "less" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeeding("less")}
                  className="rounded-full"
                >
                  Less than usual
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Done Button */}
      <Button
        onClick={onDone}
        className="w-full h-14 rounded-2xl text-lg bg-success hover:bg-success/90 text-success-foreground font-medium animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400"
      >
        Done
      </Button>
    </div>
  )
}
