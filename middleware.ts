import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          res = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware - User authenticated:", user ? user.id : "NO USER")

  // Protected routes
  const protectedRoutes = [
    "/dashboard",
    "/transactions",
    "/crm",
    "/contacts",
    "/pipeline",
    "/calendar",
    "/assistant",
    "/settings",
    "/profile",
    "/api/transactions",
  ]

  const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  // Redirect unauthenticated users
  if (!user && isProtectedRoute) {
    console.log("[v0] Middleware - Redirecting unauthenticated user from:", req.nextUrl.pathname)
    const url = req.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)"],
}
