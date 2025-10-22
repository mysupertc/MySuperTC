import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  console.log("[v0] OAuth callback received")
  console.log("[v0] Query params:", Object.fromEntries(requestUrl.searchParams))

  // Check for access_token in hash (OAuth flow) or query params
  const access_token = requestUrl.searchParams.get("access_token")
  const refresh_token = requestUrl.searchParams.get("refresh_token")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  if (error) {
    console.error("[v0] OAuth error:", error, error_description)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url),
    )
  }

  if (access_token) {
    console.log("[v0] Access token received, setting cookies and redirecting to dashboard")
    // Create response with redirect
    const response = NextResponse.redirect(new URL("/dashboard", request.url))

    // Set cookies for the session
    response.cookies.set("sb-access-token", access_token, {
      path: "/",
      maxAge: 3600,
      sameSite: "lax",
    })

    if (refresh_token) {
      response.cookies.set("sb-refresh-token", refresh_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      })
    }

    return response
  }

  // If no tokens, redirect to login
  console.log("[v0] No tokens found in callback, redirecting to login")
  return NextResponse.redirect(new URL("/auth/login", request.url))
}
