"use client"

import { MapPin, Phone, AlertCircle, Home } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface UrgentScreenProps {
  onFindEmergency: () => void
  onCallEmergency: () => void
  onHome: () => void
}

export function UrgentScreen({ onFindEmergency, onCallEmergency, onHome }: UrgentScreenProps) {
  return (
    <div className="relative flex flex-col min-h-screen bg-urgent/10 p-6">
      <Button variant="ghost" size="icon" onClick={onHome} className="absolute top-4 left-4 rounded-full">
        <Home className="w-5 h-5" />
      </Button>
      <div className="flex-1 flex flex-col">
        {/* Urgent Alert */}
        <div className="flex items-center justify-center mb-8 pt-8">
          <div className="w-20 h-20 rounded-full bg-urgent/20 flex items-center justify-center animate-in zoom-in duration-500">
            <AlertCircle className="w-12 h-12 text-urgent" />
          </div>
        </div>

        {/* Message */}
        <Card className="border-0 bg-urgent/15 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold text-urgent-foreground mb-3">
              It&apos;s safest to seek urgent medical care
            </h1>
            <p className="text-foreground/70 leading-relaxed">
              Based on what you&apos;ve described, your baby should be seen by a medical professional as soon as possible.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <Button
            onClick={onFindEmergency}
            className="w-full h-16 rounded-2xl text-lg bg-urgent hover:bg-urgent/90 text-urgent-foreground font-semibold"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Find nearest emergency department
          </Button>

          <Button
            onClick={onCallEmergency}
            variant="outline"
            className="w-full h-16 rounded-2xl text-lg border-2 border-urgent/50 hover:bg-urgent/20 text-urgent-foreground font-semibold"
          >
            <Phone className="w-5 h-5 mr-2" />
            Call emergency
          </Button>
        </div>

        {/* Reassurance */}
        <Card className="border-0 bg-card/80 shadow-sm mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              You&apos;re doing the right thing by seeking help. Trust your instincts — they brought you here.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground mt-6 px-4 leading-relaxed font-medium">
        This tool provides care navigation, not medical diagnosis. In an emergency, call <a href="tel:000" className="underline font-semibold">000</a> immediately.
      </p>
    </div>
  )
}
