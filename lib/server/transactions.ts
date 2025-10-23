import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function createTransactionInDB(req: Request, data: any) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get the currently authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User not authenticated:", userError);
    throw new Error("User not authenticated");
  }

  // Insert the new transaction linked to this user's profile
  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert([{ ...data, profile_id: user.id }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return inserted;
}
