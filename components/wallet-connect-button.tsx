"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { GlowButton } from "@/components/ui/glow-button"
import { createClient } from "@/lib/supabase/client"

interface WalletConnectButtonProps {
  onConnect?: (wallet: any) => void
  onDisconnect?: () => void
  walletAddress?: string | null
  variant?: "primary" | "accent" | "secondary"
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
    if (!connected && !propWalletAddress) {
      setError(null)
      setSuccessMessage(null)
    }
  }, [connected, propWalletAddress])

  useEffect(() => {
    const handleConnection = async () => {
      if (!connected || !publicKey || isConnecting || propWalletAddress) {
        return
      }

      const walletAddress = publicKey.toString()
      const walletName = wallet?.adapter?.name || "Unknown"
      
      setIsConnecting(true)
      setError(null)
      
      console.log("[v0] Wallet connected:", walletName, walletAddress)

      try {
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error("[v0] No valid session found:", sessionError?.message)
          setError("Please log in again to connect your wallet.")
          await disconnect()
          setIsConnecting(false)
          return
        }

        console.log("[v0] Valid session found, user:", session.user.id)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log("[v0] Saving wallet connection...")
        const response = await fetch("/api/wallet/connect", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          credentials: "include",
          body: JSON.stringify({ 
            wallet_address: walletAddress,
            wallet_type: walletName
          }),
        })

        const data = await response.json()
        console.log("[v0] Wallet connect response:", response.status, data)

        if (data.success) {
          if (data.bonus_awarded > 0) {
            setSuccessMessage(`Wallet connected! You earned ${data.bonus_awarded} points!`)
          } else {
            setSuccessMessage("Wallet connected successfully!")
          }
          onConnect?.({ address: walletAddress, type: walletName, connected_at: new Date().toISOString() })
          
          setTimeout(() => setSuccessMessage(null), 5000)
        } else {
          if (response.status === 401) {
            setError("Session expired. Please refresh and log in again.")
          } else if (data.error?.includes("already connected")) {
            setError("This wallet is already connected to another account.")
          } else {
            setError(data.error || "Failed to connect wallet. Please try again.")
          }
          console.error("[v0] Wallet connection failed:", data)
          
          await disconnect()
        }
      } catch (err) {
        console.error("[v0] Network error connecting wallet:", err)
        setError("Connection failed. Please check your internet and try again.")
        
        await disconnect()
      } finally {
        setIsConnecting(false)
      }
    }

    handleConnection()
  }, [connected, publicKey, wallet, propWalletAddress, isConnecting, onConnect, disconnect])

  const handleConnect = () => {
    setError(null)
    setSuccessMessage(null)
    console.log("[v0] Opening wallet modal...")
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
