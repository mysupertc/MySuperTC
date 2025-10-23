import { NextResponse } from "next/server"
import { createTransactionInDB } from "@/lib/server/transactions"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("sb-access-token")?.value

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const newTransaction = await createTransactionInDB(body, user?.id)
    return NextResponse.json({ success: true, transaction: newTransaction })
  } catch (err: any) {
    console.error("❌ Transaction creation failed:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
