import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith("/api")) {
    return NextResponse.next()
  }

  // Skip middleware for static assets only
  if (
    path.startsWith("/_next") ||
    (path.includes(".") && !path.startsWith("/api"))
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log(`[middleware] Auth error for ${path}:`, error.message)
    } else if (user) {
      console.log(`[middleware] User authenticated: ${user.id} accessing ${path}`)

      if (path.startsWith("/auth")) {
        console.log(`[middleware] User already authenticated, redirecting to dashboard`)
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    } else {
      if (!path.startsWith("/auth") && path !== "/") {
        console.log(`[middleware] No user found, redirecting to auth from ${path}`)
        const url = request.nextUrl.clone()
        url.pathname = "/auth"
        return NextResponse.redirect(url)
      }
    }
  } catch (error) {
    console.error(`[middleware] Error processing request:`, error)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
