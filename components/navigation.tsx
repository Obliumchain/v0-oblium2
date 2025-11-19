"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { LanguageSelector } from "./language-selector"
import { useLanguage } from "@/lib/language-context"

const DashboardIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <g fill="none" stroke={isActive ? "#86efac" : "currentColor"} strokeWidth="1">
      <circle cx="19" cy="5" r="2.5" strokeWidth="1.5" />
      <path strokeLinecap="round" strokeWidth="1.5" d="M21.25 10v5.25a6 6 0 0 1-6 6h-6.5a6 6 0 0 1-6-6V14" />
      <path strokeLinecap="round" strokeWidth="1.6" d="M8.276 16.036v-4.388m3.83 4.388V8.769m3.618 7.267v-5.51" />
    </g>
  </svg>
)

const TasksIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path
      fill={isActive ? "#86efac" : "currentColor"}
      d="M9 3h15v1.5H9zm0 9V10.5h15V12zm0 7.5V19h15v1.5zM3 9q.619 0 1.159.234t.957.645t.646.948t.234 1.172q0 .62-.234 1.16t-.646.957t-.948.646t-1.172.234q-.62 0-1.16-.234t-.957-.646t-.645-.948T.001 12t.234-1.159t.645-.957t.948-.646T3 9m0 4.688q.352 0 .656-.13t.527-.363t.363-.537t.141-.656t-.13-.656t-.363-.527t-.537-.363T3 10.314t-.656.13t-.527.363t-.363.537t-.141.656t.13.656t.363.527t.537.363t.656.141M3 16.5q.619 0 1.159.234t.957.645t.646.948t.234 1.172q0 .62-.234 1.16t-.646.957t-.948.646t-1.172.234q-.62 0-1.16-.234t-.957-.646t-.645-.948T.001 19.5t.234-1.159t.645-.957t.948-.646T3 16.5m0 4.688q.352 0 .656-.13t.527-.363t.363-.537t.141-.656t-.13-.656t-.363-.527t-.537-.363T3 18.814t-.656.13t-.527.363t-.363.537t-.141.656t.13.656t.363.527t.537.363t.656.141M2.25 4.219L5.47.972l1.055 1.055L2.953 5.625L.234 4.277l1.055-1.055z"
    />
  </svg>
)

const QuizIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <g
      fill="none"
      stroke={isActive ? "#86efac" : "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M13.498 2h-5a1.5 1.5 0 1 0 0 3h5a1.5 1.5 0 1 0 0-3m-6.5 13h3.429m-3.429-4h8" />
      <path d="M18.998 13.5V9.483c0-2.829 0-4.243-.879-5.122c-.64-.64-1.567-.814-3.12-.861M11.997 22h-3c-2.828 0-4.243 0-5.121-.88c-.879-.878-.879-2.292-.879-5.12V9.482c0-2.829 0-4.243.879-5.122c.641-.64 1.568-.814 3.121-.861M13.998 20s1 0 2 2c0 0 2.176-5 5-6" />
    </g>
  </svg>
)

const BoosterIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512">
    <path
      fill="none"
      stroke={isActive ? "#86efac" : "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="32"
      d="M461.81 53.81a4.4 4.4 0 0 0-3.3-3.39c-54.38-13.3-180 34.09-248.13 102.17a295 295 0 0 0-33.09 39.08c-21-1.9-42-.3-59.88 7.5c-50.49 22.2-65.18 80.18-69.28 105.07a9 9 0 0 0 9.8 10.4l81.07-8.9a180 180 0 0 0 1.1 18.3a18.15 18.15 0 0 0 5.3 11.09l31.39 31.39a18.15 18.15 0 0 0 11.1 5.3a180 180 0 0 0 18.19 1.1l-8.89 81a9 9 0 0 0 10.39 9.79c24.9-4 83-18.69 105.07-69.17c7.8-17.9 9.4-38.79 7.6-59.69a294 294 0 0 0 39.19-33.09c68.38-68 115.47-190.86 102.37-247.95M298.66 213.67a42.7 42.7 0 1 1 60.38 0a42.65 42.65 0 0 1-60.38 0"
    />
    <path
      fill="none"
      stroke={isActive ? "#86efac" : "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="32"
      d="M109.64 352a45.06 45.06 0 0 0-26.35 12.84C65.67 382.52 64 448 64 448s65.52-1.67 83.15-19.31A44.73 44.73 0 0 0 160 402.32"
    />
  </svg>
)

const LeaderboardIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path
      fill={isActive ? "#86efac" : "currentColor"}
      d="M4 19h4.673v-8H4zm5.673 0h4.654V5H9.673zm5.654 0H20v-6h-4.673zM3 20V10h5.673V4h6.654v8H21v8z"
    />
  </svg>
)

const ProfileIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <g fill="none">
      <path
        stroke={isActive ? "#86efac" : "currentColor"}
        strokeWidth="1.5"
        d="M21 12a8.96 8.96 0 0 1-1.526 5.016A8.99 8.99 0 0 1 12 21a8.99 8.99 0 0 1-7.474-3.984A9 9 0 1 1 21 12Z"
      />
      <path
        fill={isActive ? "#86efac" : "currentColor"}
        d="M13.25 9c0 .69-.56 1.25-1.25 1.25v1.5A2.75 2.75 0 0 0 14.75 9zM12 10.25c-.69 0-1.25-.56-1.25-1.25h-1.5A2.75 2.75 0 0 0 12 11.75zM10.75 9c0-.69.56-1.25 1.25-1.25v-1.5A2.75 2.75 0 0 0 9.25 9zM12 7.75c.69 0 1.25.56 1.25 1.25h1.5A2.75 2.75 0 0 0 12 6.25zM5.166 17.856l-.719-.214l-.117.392l.267.31zm13.668 0l.57.489l.266-.31l-.117-.393zM9 15.75h6v-1.5H9zm0-1.5a4.75 4.75 0 0 0-4.553 3.392l1.438.428A3.25 3.25 0 0 1 9 15.75zm3 6a8.23 8.23 0 0 1-6.265-2.882l-1.138.977A9.73 9.73 0 0 0 12 21.75zm3-4.5c1.47 0 2.715.978 3.115 2.32l1.438-.428A4.75 4.75 0 0 0 15 14.25zm3.265 1.618A8.23 8.23 0 0 1 12 20.25v1.5a9.73 9.73 0 0 0 7.403-3.405z"
      />
    </g>
  </svg>
)

const iconMap = {
  "/dashboard": DashboardIcon,
  "/tasks": TasksIcon,
  "/quiz": QuizIcon,
  "/booster": BoosterIcon,
  "/leaderboard": LeaderboardIcon,
  "/profile": ProfileIcon,
}

export function Navigation() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), key: "dashboard" },
    { href: "/tasks", label: t("tasks"), key: "tasks" },
    { href: "/quiz", label: t("quiz"), key: "quiz" },
    { href: "/booster", label: "Booster", key: "booster" },
    { href: "/leaderboard", label: t("leaderboard"), key: "leaderboard" },
    { href: "/profile", label: t("profile"), key: "profile" },
  ]

  return (
    <>
      <nav className="hidden lg:block fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
        <div className="bg-background/95 backdrop-blur-xl rounded-full shadow-2xl border border-cyan-500/20 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/welcome" className="flex items-center gap-2 pr-4 border-r border-foreground/10">
              <Image
                src="/logo.png"
                alt="OBLM"
                width={28}
                height={28}
                className="hover:scale-110 transition-transform duration-300"
              />
              <span
                className="text-xl font-black tracking-tight text-foreground"
                style={{ fontFamily: "Quantico, sans-serif" }}
              >
                OBLM
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = iconMap[item.href as keyof typeof iconMap]
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 text-xs font-medium ${
                        isActive
                          ? "text-green-400 bg-green-500/10"
                          : "text-foreground/70 hover:text-green-400 hover:bg-foreground/5"
                      }`}
                      style={{ fontFamily: "Quantico, sans-serif" }}
                    >
                      <Icon isActive={isActive} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="pl-4 border-l border-foreground/10">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </nav>

      <div className="lg:hidden">
        <nav className="fixed top-4 left-4 right-4 z-50 animate-fade-in-down">
          <div className="bg-background/95 backdrop-blur-xl border border-cyan-500/20 rounded-full px-4 py-3 shadow-xl">
            <div className="flex items-center justify-between">
              <Link href="/welcome" className="flex items-center gap-2">
                <Image src="/logo.png" alt="OBLM" width={28} height={28} />
                <span className="text-lg font-black tracking-tight" style={{ fontFamily: "Quantico, sans-serif" }}>
                  OBLM
                </span>
              </Link>

              <LanguageSelector />
            </div>
          </div>
        </nav>

        <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe pb-4">
          <div className="relative mx-auto max-w-md">
            <div className="relative bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl overflow-x-auto overflow-y-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-400/60 to-transparent" />

              <div className="flex items-center gap-2 px-3 py-3 min-w-max">
                {navItems.map((item, index) => {
                  const Icon = iconMap[item.href as keyof typeof iconMap]
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative group"
                      style={{
                        animationDelay: `${index * 80}ms`,
                        opacity: 0,
                        animation: "slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                      }}
                    >
                      <div
                        className={`relative flex items-center gap-2.5 transition-all duration-500 ease-out ${
                          isActive
                            ? "bg-gradient-to-r from-green-500/20 via-green-400/15 to-green-500/20 px-5 py-3 rounded-full min-w-[120px]"
                            : "bg-gray-800/40 p-3 rounded-full hover:bg-gray-700/50"
                        }`}
                        style={{
                          backdropFilter: "blur(12px)",
                          boxShadow: isActive
                            ? "0 0 20px rgba(134, 239, 172, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
                            : "inset 0 1px 0 rgba(255,255,255,0.05)",
                        }}
                      >
                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-full opacity-60 animate-pulse"
                            style={{
                              background:
                                "radial-gradient(circle at center, rgba(134, 239, 172, 0.2) 0%, transparent 70%)",
                            }}
                          />
                        )}

                        <div
                          className={`relative z-10 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}
                        >
                          <Icon isActive={isActive} />
                        </div>

                        {isActive && (
                          <span
                            className="relative z-10 text-sm font-bold text-green-400 whitespace-nowrap"
                            style={{
                              fontFamily: "Quantico, sans-serif",
                              letterSpacing: "0.5px",
                              animation: "fade-in-up 0.3s ease-out",
                            }}
                          >
                            {item.label}
                          </span>
                        )}

                        {isActive && (
                          <div
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg shadow-green-400/80"
                            style={{
                              animation: "scale-in 0.3s ease-out",
                            }}
                          />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>

              <div className="h-[2px] bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
            </div>
          </div>
        </nav>
      </div>

      <div className="h-20 lg:h-24" />
      <div className="h-24 lg:hidden" />
    </>
  )
}
