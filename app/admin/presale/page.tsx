"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { BackgroundAnimation } from "@/components/background-animation"
import { GlowButton } from "@/components/ui/glow-button"
import { CubeLoader } from "@/components/ui/cube-loader"

interface PresaleVersion {
  id: string
  version: number
  version_name: string
  total_tokens: number
  tokens_sold: number
  tokens_remaining: number
  current_price: number
  is_active: boolean
  start_date: string
  end_date?: string
  created_at: string
}

export default function AdminPresalePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [versions, setVersions] = useState<PresaleVersion[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminAndLoadVersions = async () => {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/auth")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

      if (!profile?.is_admin) {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)

      // Load all presale versions
      const { data: presaleVersions } = await supabase
        .from("presale_pool")
        .select("*")
        .order("version", { ascending: true })

      if (presaleVersions) {
        setVersions(presaleVersions)
      }

      setIsLoading(false)
    }

    checkAdminAndLoadVersions()
  }, [router])

  const handleActivateVersion = async (versionId: string, currentActive: boolean) => {
    if (currentActive) {
      alert("This version is already active")
      return
    }

    if (!confirm("Are you sure you want to activate this presale version? This will deactivate the current version.")) {
      return
    }

    setUpdating(versionId)
    const supabase = createClient()

    try {
      // Deactivate all versions first
      await supabase.from("presale_pool").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000")

      // Activate the selected version
      const { error } = await supabase.from("presale_pool").update({ is_active: true }).eq("id", versionId)

      if (error) throw error

      // Reload versions
      const { data: presaleVersions } = await supabase
        .from("presale_pool")
        .select("*")
        .order("version", { ascending: true })

      if (presaleVersions) {
        setVersions(presaleVersions)
      }

      alert("Presale version activated successfully!")
    } catch (error) {
      console.error("Error activating version:", error)
      alert("Failed to activate version")
    } finally {
      setUpdating(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <CubeLoader />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-4xl text-foreground mb-2">Presale Management</h1>
          <p className="text-foreground/60">Manage presale versions and activate/deactivate them</p>
        </div>

        <div className="space-y-4">
          {versions.map((version) => (
            <div key={version.id} className={`glass-card p-6 ${version.is_active ? "border-2 border-primary" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-display font-bold text-2xl text-foreground">{version.version_name}</h3>
                    {version.is_active && (
                      <span className="px-3 py-1 bg-primary/20 border border-primary/50 rounded-full text-primary text-xs font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-foreground/60 text-xs mb-1">Total Tokens</div>
                      <div className="font-display font-bold text-foreground">
                        {version.total_tokens.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground/60 text-xs mb-1">Tokens Sold</div>
                      <div className="font-display font-bold text-primary">{version.tokens_sold.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-foreground/60 text-xs mb-1">Tokens Remaining</div>
                      <div className="font-display font-bold text-accent">
                        {version.tokens_remaining.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground/60 text-xs mb-1">Price per Token</div>
                      <div className="font-display font-bold text-secondary">${version.current_price}</div>
                    </div>
                  </div>

                  <div className="text-foreground/60 text-sm">
                    Started: {new Date(version.start_date).toLocaleDateString()}
                    {version.end_date && ` • Ended: ${new Date(version.end_date).toLocaleDateString()}`}
                  </div>
                </div>

                <GlowButton
                  onClick={() => handleActivateVersion(version.id, version.is_active)}
                  disabled={version.is_active || updating === version.id}
                  variant={version.is_active ? "secondary" : "primary"}
                  className="ml-4"
                >
                  {updating === version.id ? "Activating..." : version.is_active ? "Active" : "Activate"}
                </GlowButton>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((version.tokens_sold / version.total_tokens) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-foreground/50 text-xs mt-1 text-right">
                  {((version.tokens_sold / version.total_tokens) * 100).toFixed(2)}% Sold
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
