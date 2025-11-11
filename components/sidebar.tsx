"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ListTodo, Trophy, User, BookOpen, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/dashboard", icon: Home, label: "dashboard" as const },
  { href: "/tasks", icon: ListTodo, label: "tasks" as const },
  { href: "/quiz", icon: BookOpen, label: "quiz" as const },
  { href: "/leaderboard", icon: Trophy, label: "leaderboard" as const },
  { href: "/profile", icon: User, label: "profile" as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth")
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex-1">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.label)}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="px-2 pb-2">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
