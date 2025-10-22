import { cookies } from "next/headers"

class QueryBuilder {
  private table: string
  private supabaseUrl: string
  private supabaseKey: string
  private selectColumns = "*"
  private filters: string[] = []
  private orderBy = ""
  private limitValue: number | null = null
  private countMode: string | null = null

  constructor(table: string, supabaseUrl: string, supabaseKey: string) {
    this.table = table
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey
  }

  select(columns = "*", options?: { count?: "exact" | "planned" | "estimated" }) {
    this.selectColumns = columns
    if (options?.count) {
      this.countMode = options.count
    }
    return this
  }

  eq(column: string, value: any) {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`)
    return this
  }

  gte(column: string, value: any) {
    this.filters.push(`${column}=gte.${encodeURIComponent(value)}`)
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending ? "asc" : "desc"
    this.orderBy = `order=${column}.${direction}`
    return this
  }

  limit(value: number) {
    this.limitValue = value
    return this
  }

  private buildUrl(): string {
    const params: string[] = []

    if (this.selectColumns !== "*") {
      params.push(`select=${this.selectColumns}`)
    }

    params.push(...this.filters)

    if (this.orderBy) {
      params.push(this.orderBy)
    }

    if (this.limitValue !== null) {
      params.push(`limit=${this.limitValue}`)
    }

    const queryString = params.length > 0 ? `?${params.join("&")}` : ""
    return `${this.supabaseUrl}/rest/v1/${this.table}${queryString}`
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const cookieStore = await cookies()
      const accessToken = cookieStore.get("sb-access-token")?.value

      const headers: Record<string, string> = {
        apikey: this.supabaseKey,
      }

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      if (this.countMode) {
        headers.Prefer = `count=${this.countMode}`
      }

      const url = this.buildUrl()
      const response = await fetch(url, {
        headers,
        cache: "no-store",
      }).catch((fetchError) => {
        // Network error - return error response
        return {
          ok: false,
          json: async () => ({ message: fetchError.message }),
          headers: new Headers(),
        } as Response
      })

      const data = await response.json()

      // Handle count response
      let count = null
      if (this.countMode && response.headers.get("content-range")) {
        const range = response.headers.get("content-range")
        count = range ? Number.parseInt(range.split("/")[1]) : null
      }

      if (!response.ok) {
        // Check if it's a schema error (table or column doesn't exist)
        const isSchemaError = data.code === "42703" || data.code === "42P01"

        if (!isSchemaError) {
          console.error("[v0] Database query error:", data.message)
        }

        resolve({
          data: null,
          error: data,
          count: null,
        })
        return
      }

      resolve({
        data,
        error: null,
        count,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      resolve({
        data: null,
        error: { message: errorMessage },
        count: null,
      })
    }
  }
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return {
    auth: {
      getUser: async () => {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get("sb-access-token")?.value

        if (!accessToken) {
          console.log("[v0] No access token found in cookies")
          return { data: { user: null }, error: null }
        }

        try {
          const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: supabaseKey,
            },
          })

          if (!response.ok) {
            console.log("[v0] Token validation failed:", response.status)
            return { data: { user: null }, error: null }
          }

          const user = await response.json()
          console.log("[v0] User authenticated:", user.email)
          return { data: { user }, error: null }
        } catch (error) {
          console.error("[v0] Error validating token:", error)
          return { data: { user: null }, error: null }
        }
      },
    },
    from: (table: string) => new QueryBuilder(table, supabaseUrl, supabaseKey),
  }
}
