"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QRCodeDisplay, downloadQRCode } from "@/components/qr-code"
import { Apple, Play, Download } from "lucide-react"

// This is the smart redirect URL - it will detect the user's OS and redirect accordingly
// In production, replace with your actual deployed URL
const SMART_DOWNLOAD_LINK = typeof window !== "undefined" 
  ? `${window.location.origin}/download` 
  : "/download"

export function DownloadSection() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  
  const handleQRGenerated = useCallback((dataUrl: string) => {
    setQrDataUrl(dataUrl)
  }, [])

  const handleDownload = () => {
    if (qrDataUrl) {
      downloadQRCode(qrDataUrl, "foodhouse-qr-code.png")
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Download the App
        </h2>
        <p className="mt-3 text-muted-foreground">
          Scan with your phone camera to download Foodhouse
        </p>
      </div>

      <Card className="border-border bg-card mx-auto max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-foreground">
            Get Foodhouse
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Works on both iOS and Android
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <QRCodeDisplay url={SMART_DOWNLOAD_LINK} size={200} onGenerated={handleQRGenerated} />
          </div>
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Apple className="h-5 w-5" />
              <span className="text-sm">iOS</span>
            </div>
            <span className="text-border">|</span>
            <div className="flex items-center gap-1.5">
              <Play className="h-5 w-5" />
              <span className="text-sm">Android</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>

          <p className="text-xs text-center text-muted-foreground max-w-xs">
            The QR code automatically detects your device and takes you to the right app store. Download it to use on print materials, t-shirts, posters, etc.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
