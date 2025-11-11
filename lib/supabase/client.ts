"use client"

import { createBrowserClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "oblium-auth",
      },
      global: {
        fetch: (url, options = {}) => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)

          return fetch(url, {
            ...options,
            signal: controller.signal,
            keepalive: true,
          }).finally(() => clearTimeout(timeoutId))
        },
      },
      db: {
        schema: "public",
      },
    },
  )

  return supabaseInstance
}
