import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

/**
 * Creates a new transaction in Supabase with automatic profile linkage
 * @param data - Object containing transaction details (address, mls_number, etc.)
 * @param userId - (optional) Supabase user ID to link as profile_id
 */
export async function createTransactionInDB(data: any, userId?: string) {
  try {
    const insertData = { ...data }
    if (userId) insertData.profile_id = userId

    const { data: inserted, error } = await supabase.from("transactions").insert([insertData]).select().single()

    if (error) throw new Error(error.message)
    return inserted
  } catch (err: any) {
    console.error("❌ Error inserting transaction:", err.message)
    throw err
  }
}
