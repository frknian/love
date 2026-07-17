import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { genderOptions, type Gender } from "@/types/profile";

function isGender(value: unknown): value is Gender {
  return genderOptions.includes(value as Gender);
}

export const getMyGender = cache(async function getMyGender(): Promise<Gender> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_gender");
  if (error || !isGender(data)) return "undisclosed";
  return data;
});
