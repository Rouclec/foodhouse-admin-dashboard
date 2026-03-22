"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Apple, Play } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const STORE_LINKS = {
  ios: process.env.NEXT_PUBLIC_IOS_STORE_LINK ?? "",
  android: process.env.NEXT_PUBLIC_ANDROID_STORE_LINK ?? "",
}

type Platform = "ios" | "android" | "desktop" | "detecting"

function detectPlatform(): Platform {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return "ios"
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return "android"
  }

  // Desktop/other
  return "desktop"
}

export default function DownloadRedirectPage() {
  const [platform, setPlatform] = useState<Platform>("detecting")

  useEffect(() => {
    const detected = detectPlatform()
    setPlatform(detected)

    // Auto-redirect for mobile devices
    if (detected === "ios") {
      window.location.href = STORE_LINKS.ios
    } else if (detected === "android") {
      window.location.href = STORE_LINKS.android
    }
  }, [])

  // Show loading while detecting
  if (platform === "detecting") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 h-8 w-8" />
          <p className="text-muted-foreground">Detecting your device...</p>
        </div>
      </main>
    )
  }

  // Show redirecting message for mobile
  if (platform === "ios" || platform === "android") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 h-8 w-8" />
          <p className="text-muted-foreground">
            Redirecting to {platform === "ios" ? "App Store" : "Google Play"}...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Not redirecting?{" "}
            <a
              href={platform === "ios" ? STORE_LINKS.ios : STORE_LINKS.android}
              className="text-primary underline"
            >
              Click here
            </a>
          </p>
        </div>
      </main>
    )
  }

  // Desktop fallback - show both options
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Download Foodhouse</CardTitle>
          <CardDescription>
            Choose your platform to download the app
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href={STORE_LINKS.ios as any}>
              <Apple className="mr-2 h-5 w-5" />
              Download on App Store
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href={STORE_LINKS.android as any}>
              <Play className="mr-2 h-5 w-5" />
              Get it on Google Play
            </Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            <Link href="/" className="underline">
              Back to homepage
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
