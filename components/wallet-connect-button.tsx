"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { GlowButton } from "@/components/ui/glow-button"
import { Info, ExternalLink } from 'lucide-react'

interface WalletConnectButtonProps {
  onConnect?: (wallet: any) => void
  onDisconnect?: () => void
  walletAddress?: string | null
  variant?: "primary" | "accent" | "secondary"
}

const isIOS = () => {
  if (typeof window === "undefined") return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

const isPhantomBrowser = () => {
  if (typeof window === "undefined") return false
  return window.phantom?.solana?.isPhantom === true
}

export function WalletConnectButton({
  onConnect,
  onDisconnect,
  walletAddress: propWalletAddress,
  variant = "primary",
}: WalletConnectButtonProps) {
  const { publicKey, disconnect, connected, connecting } = useWallet()
  const { setVisible } = useWalletModal()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showIOSOptions, setShowIOSOptions] = useState(false)

  useEffect(() => {
    const handleConnection = async () => {
      if (connected && publicKey) {
        const walletAddress = publicKey.toString()
        console.log("[v0] Wallet connected:", walletAddress)

        console.log("[v0] Waiting for session to stabilize...")
        await new Promise((resolve) => setTimeout(resolve, 1500))

        try {
          console.log("[v0] Sending wallet connection request...")
          const response = await fetch("/api/wallet/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ wallet_address: walletAddress }),
          })

          console.log("[v0] Response status:", response.status)
          const data = await response.json()
          console.log("[v0] Response data:", data)

          if (data.success) {
            if (data.bonus_awarded > 0) {
              setSuccessMessage(`Wallet connected! You earned ${data.bonus_awarded} points!`)
            } else {
              setSuccessMessage("Wallet connected successfully!")
            }
            onConnect?.({ address: walletAddress, type: "phantom", connected_at: new Date().toISOString() })
          } else {
            if (response.status === 401) {
              setError("Authentication error. Please refresh the page and try connecting again.")
            } else {
              setError(data.error || "Failed to save wallet connection")
            }
          }
        } catch (err) {
          console.error("[v0] Connection error:", err)
          setError(err instanceof Error ? err.message : "Connection failed")
        }
      }
    }

    handleConnection()
  }, [connected, publicKey, onConnect])

  const handleConnect = () => {
    setError(null)
    setSuccessMessage(null)

    const isiOSDevice = isIOS()
    const isInPhantom = isPhantomBrowser()

    console.log("[v0] Connect clicked - iOS:", isiOSDevice, "InPhantom:", isInPhantom, "Connecting:", connecting)

    if (isiOSDevice && !isInPhantom) {
      console.log("[v0] iOS Safari detected - showing iOS options")
      setShowIOSOptions(true)
      return
    }

    console.log("[v0] Opening wallet modal for Android/Desktop")
    setVisible(true)
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      onDisconnect?.()
      setSuccessMessage(null)
      setError(null)
      setShowIOSOptions(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnection failed")
    }
  }

  const connectViaUniversalLink = () => {
    const currentUrl = window.location.href
    const appUrl = encodeURIComponent(currentUrl)

    const phantomUniversalLink = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}&redirect_link=${appUrl}`

    console.log("[v0] Opening Phantom via universal link")
    window.location.href = phantomUniversalLink
  }

  const openInPhantomBrowser = () => {
    const currentUrl = window.location.href
    const phantomBrowserUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=oblium`

    console.log("[v0] Opening in Phantom browser")
    window.location.href = phantomBrowserUrl
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  if (connected && publicKey) {
    const walletAddress = publicKey.toString()
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 px-4 py-3 bg-background/50 border border-primary/30 rounded-lg">
            <div className="text-xs text-foreground/60 mb-1">Connected Wallet</div>
            <div className="text-sm font-mono text-primary">{formatAddress(walletAddress)}</div>
          </div>
          <GlowButton onClick={handleDisconnect} variant={variant} className="px-6">
            Disconnect
          </GlowButton>
        </div>
        {successMessage && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-400">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <GlowButton onClick={handleConnect} disabled={connecting} variant={variant} className="w-full">
        {connecting ? "Connecting..." : "Connect Wallet"}
      </GlowButton>

      {showIOSOptions && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">iOS Wallet Connection</h4>
              <p className="text-xs text-foreground/70 mb-3">Choose how you'd like to connect your Phantom wallet:</p>

              <div className="space-y-2">
                <button
                  onClick={connectViaUniversalLink}
                  className="w-full p-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-primary mb-1">Quick Connect</div>
                      <div className="text-xs text-foreground/60">Opens Phantom to approve connection</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </div>
                </button>

                <button
                  onClick={openInPhantomBrowser}
                  className="w-full p-3 bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-accent mb-1">Use Phantom Browser</div>
                      <div className="text-xs text-foreground/60">Full experience in Phantom app</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-accent" />
                  </div>
                </button>
              </div>

              <p className="text-xs text-foreground/50 mt-3 text-center">
                iOS Safari doesn't support direct wallet injection
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
