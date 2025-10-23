import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function createTransactionInDB(cookieStore: ReturnType<typeof cookies>, data: any) {
  // ✅ Initialize Supabase with cookies
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // ✅ Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // ✅ Insert new transaction and link to the user's profile
  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert([{ ...data, profile_id: user.id }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return inserted;
}
