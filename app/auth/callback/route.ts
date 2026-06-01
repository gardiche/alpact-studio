import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/hub`);
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as "magiclink" | "email" });
    if (!error) {
      return NextResponse.redirect(`${origin}/hub`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
