"use client"

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createClient() {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "oblium-auth",
        flowType: "pkce",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-client-info": "oblium-web",
        },
      },
    },
  )

  return supabaseInstance
}

export const createBrowserClient = createClient

const queryCache = new Map<string, { data: any; timestamp: number }>()

export function getCachedQuery(key: string, ttlMs = 30000) {
  const cached = queryCache.get(key)
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data
  }
  return null
}

export function setCachedQuery(key: string, data: any) {
  queryCache.set(key, { data, timestamp: Date.now() })
  // Clean old cache entries
  if (queryCache.size > 100) {
    const oldestKey = Array.from(queryCache.keys())[0]
    queryCache.delete(oldestKey)
  }
}
