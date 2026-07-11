import { toAppUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentAppUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? toAppUser(user) : null;
}
