// POST /api/astryd/sso-token
// Génère un JWT signé pour authentifier l'user Alpact dans l'iframe Astryd.
// Le token contient l'email, le nom et l'ID Alpact de l'user.
// Astryd vérifie ce token et connecte automatiquement l'user.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export const runtime = "nodejs";

function getSecret(): Uint8Array {
  const secret = process.env.ASTRYD_SSO_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ASTRYD_SSO_SECRET manquant ou trop court (min 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Récupérer le profil complet
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
    }

    // Générer un JWT signé avec une durée de vie courte (5 min)
    const token = await new SignJWT({
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      alpact_user_id: user.id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .setIssuer("alpact-studio")
      .setSubject(profile.email)
      .sign(getSecret());

    return NextResponse.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
