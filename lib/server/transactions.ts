import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function createTransactionInDB(req: Request, data: any) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert([{ ...data, profile_id: user.id }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return inserted;
}
