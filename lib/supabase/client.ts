export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        console.log("[v0] Attempting sign in with password")
        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.log("[v0] Sign in failed:", data)
          return { data: { user: null, session: null }, error: data }
        }

        console.log("[v0] Sign in successful")
        // Store session in localStorage
        if (typeof window !== "undefined" && data.access_token) {
          localStorage.setItem("supabase.auth.token", data.access_token)
          document.cookie = `sb-access-token=${data.access_token}; path=/; max-age=3600; SameSite=Lax`
          if (data.refresh_token) {
            document.cookie = `sb-refresh-token=${data.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
          }
        }

        return { data, error: null }
      },
      signUp: async ({
        email,
        password,
        options,
      }: {
        email: string
        password: string
        options?: { emailRedirectTo?: string }
      }) => {
        console.log("[v0] Attempting sign up")
        const body: any = { email, password }

        // Supabase expects redirect URL in options.emailRedirectTo
        if (options?.emailRedirectTo) {
          body.options = {
            emailRedirectTo: options.emailRedirectTo,
          }
        }

        const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify(body),
        })

        const data = await response.json()

        if (!response.ok) {
          console.log("[v0] Sign up failed:", data)
          return { data: { user: null, session: null }, error: data }
        }

        console.log("[v0] Sign up successful, confirmation required:", !data.access_token)
        // Store session if auto-confirmed
        if (typeof window !== "undefined" && data.access_token) {
          localStorage.setItem("supabase.auth.token", data.access_token)
          document.cookie = `sb-access-token=${data.access_token}; path=/; max-age=3600; SameSite=Lax`
          if (data.refresh_token) {
            document.cookie = `sb-refresh-token=${data.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
          }
        }

        return { data, error: null }
      },
      signInWithOAuth: async ({ provider }: { provider: string }) => {
        if (typeof window === "undefined") {
          return { data: { url: null }, error: { message: "Cannot redirect on server" } }
        }

        console.log("[v0] Initiating OAuth with provider:", provider)

        const redirectUrl = `${window.location.origin}/auth/callback`
        const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}`

        console.log("[v0] Redirecting to:", authUrl)

        // This prevents the browser from keeping the current page in history
        try {
          window.location.replace(authUrl)
        } catch (e) {
          console.error("[v0] Redirect failed:", e)
          return { data: { url: null }, error: { message: "Redirect failed" } }
        }

        // Return a promise that never resolves since we're redirecting away
        return new Promise(() => {})
      },
      signOut: async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("supabase.auth.token") : null

        if (token) {
          await fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: supabaseKey,
            },
          })
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem("supabase.auth.token")
          document.cookie = "sb-access-token=; path=/; max-age=0"
          document.cookie = "sb-refresh-token=; path=/; max-age=0"
        }
        return { error: null }
      },
      getSession: async () => {
        if (typeof window === "undefined") {
          return { data: { session: null }, error: null }
        }

        const token = localStorage.getItem("supabase.auth.token")
        if (!token) {
          return { data: { session: null }, error: null }
        }

        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            apikey: supabaseKey,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })

        if (!response.ok) {
          return { data: { session: null }, error: null }
        }

        const user = await response.json()
        return { data: { session: { user, access_token: token } }, error: null }
      },
      setSession: async ({ access_token, refresh_token }: { access_token: string; refresh_token?: string }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("supabase.auth.token", access_token)
          document.cookie = `sb-access-token=${access_token}; path=/; max-age=3600; SameSite=Lax`
          if (refresh_token) {
            document.cookie = `sb-refresh-token=${refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
          }
        }
        return { data: { session: { access_token, refresh_token } }, error: null }
      },
    },
    from: (table: string) => ({
      select: async (columns = "*") => {
        const token = typeof window !== "undefined" ? localStorage.getItem("supabase.auth.token") : null

        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
          headers: {
            apikey: supabaseKey,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })

        const data = await response.json()
        return { data, error: response.ok ? null : data }
      },
      insert: async (values: any) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("supabase.auth.token") : null

        const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Prefer: "return=representation",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(values),
        })

        const data = await response.json()
        return { data, error: response.ok ? null : data }
      },
      update: async (values: any) => ({
        eq: async (column: string, value: any) => {
          const token = typeof window !== "undefined" ? localStorage.getItem("supabase.auth.token") : null

          const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              Prefer: "return=representation",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(values),
          })

          const data = await response.json()
          return { data, error: response.ok ? null : data }
        },
      }),
    }),
  }
}
