import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export async function createTransactionInDB(data: any) {
  const { data: inserted, error } = await supabase.from("transactions").insert([data]).select().single()

  if (error) throw new Error(error.message)
  return inserted
}
