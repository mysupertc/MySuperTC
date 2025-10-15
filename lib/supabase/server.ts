export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return {
    auth: {
      getUser: async () => {
        // Server-side auth check - for now return null
        return { data: { user: null }, error: null }
      },
    },
    from: (table: string) => ({
      select: async (columns = "*") => {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
          headers: {
            apikey: supabaseKey,
          },
          cache: "no-store",
        })

        const data = await response.json()
        return { data, error: response.ok ? null : data }
      },
    }),
  }
}
