import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createTransactionInDB(data: any) {
  console.log("[v0] Creating transaction - checking environment variables")
  console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET")
  console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET")

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )

  console.log("[v0] Supabase client created, attempting to get user")

  // Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  console.log("[v0] User fetch result:", { user: user?.id, error: userError?.message })

  if (userError || !user) {
    console.error("[v0] Authentication failed:", userError?.message || "No user found")
    throw new Error("User not authenticated. Please log in and try again.")
  }

  console.log("[v0] User authenticated:", user.id)

  // Insert new transaction and link to the user's profile
  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert([{ ...data, profile_id: user.id }])
    .select()
    .single()

  if (error) {
    console.error("[v0] Transaction insert failed:", error.message)
    throw new Error(error.message)
  }

  console.log("[v0] Transaction created successfully:", inserted.id)
  return inserted
}
