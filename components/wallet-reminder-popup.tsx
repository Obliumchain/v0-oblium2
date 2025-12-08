"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface WalletReminderPopupProps {
  userId: string
  hasWallet: boolean
}

export function WalletReminderPopup({ userId, hasWallet }: WalletReminderPopupProps) {
  const [showPopup, setShowPopup] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // Don't show popup if user already has a wallet
    if (hasWallet) return

    // Show popup every 60 seconds for 5 seconds
    const interval = setInterval(() => {
      setShowPopup(true)

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowPopup(false)
      }, 5000)
    }, 60000) // Every 1 minute

    // Show immediately on mount
    setShowPopup(true)
    setTimeout(() => {
      setShowPopup(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [hasWallet])

  const handleConnectWallet = () => {
    const walletAppUrl = process.env.NEXT_PUBLIC_WALLET_CONNECT_APP_URL || "https://connect.obliumtoken.com"
    window.location.href = `${walletAppUrl}?userId=${userId}`
  }

  if (hasWallet) return null

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {t("connectWalletReminder") || "Connect Your Phantom Wallet"}
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p className="text-base">
              {t("connectWalletReminderDesc") || "Use Phantom Browser to connect your wallet and earn"}
            </p>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-primary">
              <span>10,000 Points + 150 OBLM</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleConnectWallet} size="lg" className="w-full">
            <Wallet className="mr-2 h-5 w-5" />
            {t("connectWallet") || "Connect Wallet"}
          </Button>
          <Button variant="ghost" onClick={() => setShowPopup(false)} className="w-full">
            {t("remindLater") || "Remind Me Later"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
