import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const cookieStore = await cookies()
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  console.log("[v0] Auth callback received")
  console.log("[v0] Full URL:", requestUrl.href)
  console.log("[v0] Query params:", Object.fromEntries(requestUrl.searchParams))

  // Check for error first
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  if (error) {
    console.error("[v0] Auth error:", error, error_description)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url),
    )
  }

  if (code) {
    console.log("[v0] Email confirmation: Code received, exchanging for session")

    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("[v0] Session exchange failed:", exchangeError)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent("Failed to confirm email")}`, request.url),
      )
    } else {
      console.log("[v0] Session exchange successful")

      // Set cookies
      cookieStore.set("sb-access-token", data.access_token, {
        path: "/",
        maxAge: 3600,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })

      if (data.refresh_token) {
        cookieStore.set("sb-refresh-token", data.refresh_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        })
      }

      console.log("[v0] Redirecting to dashboard")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Check for access_token (OAuth flow)
  const access_token = requestUrl.searchParams.get("access_token")
  const refresh_token = requestUrl.searchParams.get("refresh_token")

  if (access_token) {
    console.log("[v0] OAuth: Access token received, setting cookies")

    // Set cookies for the session
    cookieStore.set("sb-access-token", access_token, {
      path: "/",
      maxAge: 3600,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    if (refresh_token) {
      cookieStore.set("sb-refresh-token", refresh_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    console.log("[v0] Redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If no tokens or code, redirect to login
  console.log("[v0] No auth data found in callback, redirecting to login")
  return NextResponse.redirect(new URL("/auth/login", request.url))
}
