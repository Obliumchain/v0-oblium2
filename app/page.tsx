"use client"
import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    // Check if there's a ref parameter in the URL
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get("ref")

    if (refCode) {
      // Redirect to auth page with referral code
      window.location.href = `/auth?ref=${refCode}`
    } else {
      // Normal redirect to welcome page
      window.location.href = "/welcome"
    }
  }, [])

  return null
}
