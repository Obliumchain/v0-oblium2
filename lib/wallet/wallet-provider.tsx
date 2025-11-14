"use client"

import { useMemo, type ReactNode } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { SOLANA_CONFIG } from "@/lib/solana/config"

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css"

const isIOS = () => {
  if (typeof window === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  // Get network from environment variable
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as "devnet" | "mainnet-beta" | "testnet"

  const endpoint = useMemo(() => SOLANA_CONFIG.rpcUrl, [])

  const wallets = useMemo(() => {
    const phantomAdapter = new PhantomWalletAdapter()
    const solflareAdapter = new SolflareWalletAdapter({
      // Disable iframe to prevent CSP blocking
      disableIframe: true,
    })

    // iOS-specific configuration for universal links
    if (isIOS()) {
      console.log("[v0] iOS detected - prioritizing Phantom for wallet connection")
    }

    // Phantom is first in the array, making it the default/primary wallet
    return [phantomAdapter, solflareAdapter]
  }, [])

  const shouldAutoConnect = useMemo(() => {
    if (typeof window === "undefined") return false

    const isPhantomBrowser = window.phantom?.solana?.isPhantom === true
    const hasPhantomStored = localStorage.getItem("walletName") === "Phantom"
    
    // Auto-connect only if Phantom is available or was previously connected
    return isPhantomBrowser || hasPhantomStored
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={shouldAutoConnect}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
