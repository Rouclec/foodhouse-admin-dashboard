"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

interface QRCodeDisplayProps {
  url: string
  size?: number
  className?: string
  onGenerated?: (dataUrl: string) => void
}

export function QRCodeDisplay({ url, size = 200, className, onGenerated }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        })
        setQrDataUrl(dataUrl)
        onGenerated?.(dataUrl)
      } catch (error) {
        console.error("Failed to generate QR code:", error)
      }
    }
    generateQR()
  }, [url, size, onGenerated])

  if (!qrDataUrl) {
    return (
      <div
        className={`bg-muted animate-pulse rounded-lg ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <img
      src={qrDataUrl}
      alt={`QR Code for ${url}`}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  )
}

export function downloadQRCode(dataUrl: string, filename: string = "qr-code.png") {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
