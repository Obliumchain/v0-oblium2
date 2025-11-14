"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { GlowButton } from "@/components/ui/glow-button"

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
  const { publicKey, disconnect, connected, connecting, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const handleConnection = async () => {
      if (!connected || !publicKey || isConnecting || propWalletAddress) {
        return
      }

      const walletAddress = publicKey.toString()
      const walletName = wallet?.adapter?.name || "Unknown"
      
      setIsConnecting(true)
      setError(null)
      
      console.log("[v0] New wallet connected:", walletName, walletAddress)

      try {
        await new Promise(resolve => setTimeout(resolve, 1200))
        
        console.log("[v0] Saving wallet connection to database...")
        const response = await fetch("/api/wallet/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            wallet_address: walletAddress,
            wallet_type: walletName
          }),
        })

        const data = await response.json()
        console.log("[v0] API response:", response.status, data)

        if (data.success) {
          if (data.bonus_awarded > 0) {
            setSuccessMessage(`Wallet connected! You earned ${data.bonus_awarded} points!`)
          } else {
            setSuccessMessage("Wallet connected successfully!")
          }
          onConnect?.({ address: walletAddress, type: walletName, connected_at: new Date().toISOString() })
        } else {
          if (response.status === 401) {
            setError(
              "Unable to save wallet. Please refresh the page and try again."
            )
            console.error("[v0] Auth error saving wallet. ErrorId:", data.errorId)
          } else if (data.error?.includes("already connected")) {
            setError("This wallet is already connected to another account")
          } else {
            setError(data.error || "Failed to save wallet connection")
          }
          console.error("[v0] Wallet save failed:", data)
        }
      } catch (err) {
        console.error("[v0] Network error saving wallet:", err)
        setError("Connection failed. Please check your internet and try again.")
      } finally {
        setIsConnecting(false)
      }
    }

    handleConnection()
  }, [connected, publicKey, wallet, propWalletAddress, isConnecting, onConnect])

  const handleConnect = () => {
    setError(null)
    setSuccessMessage(null)

    const isiOSDevice = isIOS()
    const isInPhantom = isPhantomBrowser()

    console.log("[v0] Connect clicked - iOS:", isiOSDevice, "InPhantom:", isInPhantom)

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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  const displayWalletAddress = publicKey?.toString() || propWalletAddress
  const isWalletConnected = connected || propWalletAddress

  if (isWalletConnected && displayWalletAddress) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 px-4 py-3 bg-background/50 border border-primary/30 rounded-lg">
            <div className="text-xs text-foreground/60 mb-1">Connected Wallet</div>
            <div className="text-sm font-mono text-primary">{formatAddress(displayWalletAddress)}</div>
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
      <GlowButton onClick={handleConnect} disabled={connecting || isConnecting} variant={variant} className="w-full">
        {connecting || isConnecting ? "Connecting..." : "Connect Wallet"}
      </GlowButton>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
