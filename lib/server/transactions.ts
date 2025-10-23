import { createClient } from "@supabase/supabase-js"

// Use your Supabase project URL and service key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export async function createTransactionInDB(data: any) {
  try {
    // Fetch user from Supabase auth context
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    // Retrieve matching profile_id from your profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!profile) {
      throw new Error("Profile not found for authenticated user")
    }

    // Construct full insert payload
    const payload = {
      ...data,
      profile_id: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert([payload])
      .select()
      .single()

    if (error) throw new Error(error.message)

    console.log("✅ Transaction created successfully:", inserted)
    return inserted
  } catch (err: any) {
    console.error("❌ Error inserting transaction:", err)
    throw new Error(err.message)
  }
}
