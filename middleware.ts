import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques — toujours accessibles
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/integrations/notion/callback") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  // Créer la réponse de base (pour la mise à jour des cookies de session)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchir la session (obligatoire pour que les cookies soient à jour)
  const { data: { user } } = await supabase.auth.getUser();

  // Rediriger / → /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Non authentifié → /login
  if (!isPublic && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authentifié sur /login → rediriger vers le bon shell
  if (user && pathname.startsWith("/login")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "entrepreneur";
    const dest = role === "structure" ? "/org" : "/hub";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
