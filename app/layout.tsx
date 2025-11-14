import type React from "react"
import { Orbitron, Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/lib/language-context"
import { SolanaWalletProvider } from "@/lib/wallet/wallet-provider"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-orbitron",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata = {
  title: "Oblium - Mine. Earn. Ascend.",
  description: "Futuristic crypto mining dashboard powered by Solana",
  generator: "v0.app",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable}`}>
      <body className="bg-background text-foreground">
        <LanguageProvider>
          <SolanaWalletProvider>{children}</SolanaWalletProvider>
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
