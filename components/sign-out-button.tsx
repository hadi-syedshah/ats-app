"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return <button className="button button-secondary button-small" onClick={async () => { await createSupabaseBrowserClient().auth.signOut(); router.replace("/login"); router.refresh(); }}>Sign out</button>;
}
