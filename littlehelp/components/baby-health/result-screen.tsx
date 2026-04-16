"use client"

import { MapPin, Phone, Pill, RotateCcw, Home } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ResultScreenProps {
  onFindGP: () => void
  onFindPharmacy: () => void
  onCallClinic: () => void
  onAskAgain: () => void
}

export function ResultScreen({ onFindGP, onFindPharmacy, onCallClinic, onAskAgain }: ResultScreenProps) {
  return (
    <div className="relative flex flex-col min-h-screen bg-background p-6">
      <Button variant="ghost" size="icon" onClick={onAskAgain} className="absolute top-4 left-4 rounded-full">
        <Home className="w-5 h-5" />
      </Button>
      <div className="flex-1 flex flex-col pt-10">
        {/* Result Card */}
        <Card className="border-0 bg-warning/15 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/30 flex items-center justify-center shrink-0">
                <span className="text-2xl">🟡</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Suggested next step
                </h2>
                <p className="text-lg text-warning-foreground font-medium">
                  See a GP today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card className="border-0 bg-card shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardContent className="p-5">
            <p className="text-foreground/80 leading-relaxed">
              Based on your baby&apos;s symptoms and age, it&apos;s a good idea to have a doctor take a look today. 
              This isn&apos;t an emergency, but getting checked will give you peace of mind.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <Button
            onClick={onFindGP}
            className="w-full h-14 rounded-2xl text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Find GP nearby
          </Button>

          <Button
            onClick={onFindPharmacy}
            variant="outline"
            className="w-full h-14 rounded-2xl text-lg border-2 border-primary/30 hover:bg-primary/10 text-foreground"
          >
            <Pill className="w-5 h-5 mr-2" />
            Find pharmacy nearby
          </Button>

          <Button
            onClick={onCallClinic}
            variant="outline"
            className="w-full h-14 rounded-2xl text-lg border-2 border-primary/30 hover:bg-primary/10 text-foreground"
          >
            <Phone className="w-5 h-5 mr-2" />
            Call a clinic
          </Button>

          <Button
            onClick={onAskAgain}
            variant="ghost"
            className="w-full h-12 rounded-2xl text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Ask again
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-center text-muted-foreground mt-8 px-4 leading-relaxed">
        <p className="font-medium">This tool provides care navigation, not medical diagnosis. In an emergency, call <a href="tel:000" className="underline font-semibold">000</a> immediately.</p>
        <p className="mt-1">Always trust your instincts as a parent.</p>
      </div>
    </div>
  )
}
