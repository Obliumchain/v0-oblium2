"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { LiquidCard } from "@/components/ui/liquid-card"
import { BackgroundAnimation } from "@/components/background-animation"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"

interface User {
  id: string
  nickname: string
  points: number
  email: string
  created_at: string
  referral_count: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      // For now, any logged-in user can access admin
      // You can add additional checks here
      setIsAuthorized(true)
      await loadUsers()
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      setIsAuthorized(false)
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const supabase = createClient()

      // Get all profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false })

      if (error) throw error

      if (profiles) {
        // Get referral counts
        const usersWithCounts = await Promise.all(
          profiles.map(async (profile) => {
            const { count } = await supabase
              .from("referrals")
              .select("*", { count: "exact", head: true })
              .eq("referrer_id", profile.id)

            // Get user email from auth
            const {
              data: { users },
            } = await supabase.auth.admin.listUsers()
            const authUser = users?.find((u) => u.id === profile.id)

            return {
              id: profile.id,
              nickname: profile.nickname || `Miner-${profile.id.substring(0, 6)}`,
              points: profile.points || 0,
              email: authUser?.email || "No email",
              created_at: profile.created_at,
              referral_count: count || 0,
            }
          }),
        )

        setUsers(usersWithCounts)
      }
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUser = async (userId: string, nickname: string) => {
    if (!confirm(`Are you sure you want to delete user "${nickname}"? This action cannot be undone.`)) {
      return
    }

    setDeletingUserId(userId)

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      alert(`User "${nickname}" has been deleted successfully`)
      await loadUsers()
    } catch (error: any) {
      console.error("[v0] Error deleting user:", error)
      alert(`Failed to delete user: ${error.message}`)
    } finally {
      setDeletingUserId(null)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.includes(searchTerm),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <div className="text-primary text-lg">Loading admin panel...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <LiquidCard className="p-8 max-w-md mx-4">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-foreground/60 mb-6">You do not have permission to access this page.</p>
            <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
          </div>
        </LiquidCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Admin Panel</h1>
          <p className="text-foreground/60">Manage users and detect suspicious activity</p>
        </div>

        <LiquidCard className="p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by nickname, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 bg-background/50 border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary transition-colors"
            />
            <Button onClick={loadUsers} variant="outline">
              Refresh
            </Button>
          </div>

          <div className="text-sm text-foreground/60 mb-4">Total Users: {users.length}</div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-display font-bold text-foreground/60 text-sm">Nickname</th>
                  <th className="text-left py-4 px-4 font-display font-bold text-foreground/60 text-sm">Email</th>
                  <th className="text-right py-4 px-4 font-display font-bold text-foreground/60 text-sm">Points</th>
                  <th className="text-right py-4 px-4 font-display font-bold text-foreground/60 text-sm">Referrals</th>
                  <th className="text-center py-4 px-4 font-display font-bold text-foreground/60 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-foreground">{user.nickname}</div>
                      <div className="text-xs text-foreground/40 font-mono">{user.id.substring(0, 8)}...</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-foreground/80">{user.email}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-display font-bold text-primary">{user.points.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-accent">{user.referral_count}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button
                        onClick={() => deleteUser(user.id, user.nickname)}
                        disabled={deletingUserId === user.id}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingUserId === user.id ? "Deleting..." : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LiquidCard>
      </div>
    </div>
  )
}
