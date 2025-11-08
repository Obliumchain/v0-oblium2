"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { GlowButton } from "@/components/ui/glow-button"
import { Info } from "lucide-react"

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
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    if (isIOS() && !isPhantomBrowser()) {
      setShowIOSInstructions(true)
    }
  }, [])

  useEffect(() => {
    const handleConnection = async () => {
      if (connected && publicKey) {
        const walletAddress = publicKey.toString()

        try {
          const response = await fetch("/api/wallet/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet_address: walletAddress }),
          })

          const data = await response.json()

          if (data.success) {
            if (data.bonus_awarded > 0) {
              setSuccessMessage(`Wallet connected! You earned ${data.bonus_awarded} points! 🎉`)
            } else {
              setSuccessMessage("Wallet connected successfully!")
            }
            onConnect?.({ address: walletAddress, type: "phantom", connected_at: new Date().toISOString() })
          } else {
            setError(data.error || "Failed to save wallet connection")
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Connection failed")
        }
      }
    }

    handleConnection()
  }, [connected, publicKey, onConnect])

  const handleConnect = () => {
    setError(null)
    setSuccessMessage(null)

    if (isIOS() && !isPhantomBrowser()) {
      setShowIOSInstructions(true)
      return
    }

    setVisible(true)
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      onDisconnect?.()
      setSuccessMessage(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnection failed")
    }
  }

  const openInPhantom = () => {
    const currentUrl = window.location.href
    const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=oblium`
    window.location.href = phantomUrl
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

      {showIOSInstructions && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">iOS Users: Open in Phantom App</h4>
              <p className="text-xs text-foreground/70 mb-3">
                Wallet connections on iOS Safari are not supported due to browser limitations. To connect your wallet:
              </p>
              <ol className="text-xs text-foreground/70 space-y-1 list-decimal list-inside mb-3">
                <li>Click the button below to open this page in Phantom</li>
                <li>Your wallet will automatically connect</li>
                <li>Continue using Oblium from within the Phantom app</li>
              </ol>
              <GlowButton onClick={openInPhantom} variant="accent" className="w-full">
                Open in Phantom App
              </GlowButton>
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
