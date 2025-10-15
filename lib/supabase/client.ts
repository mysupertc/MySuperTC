export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
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
          return { data: { user: null, session: null }, error: data }
        }

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
        const body: any = { email, password }

        // Add redirect URL if provided
        if (options?.emailRedirectTo) {
          body.data = { redirect_to: options.emailRedirectTo }
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
          return { data: { user: null, session: null }, error: data }
        }

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

        const redirectTo = `${window.location.origin}/auth/callback`
        const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`

        // Redirect to OAuth provider
        window.location.href = authUrl

        return { data: { url: authUrl }, error: null }
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
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
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
