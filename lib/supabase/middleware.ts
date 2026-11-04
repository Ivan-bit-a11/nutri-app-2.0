import { type NextRequest, NextResponse } from "next/server"
import { fallbackLng, localeCookieName, resolveLanguage } from "@/i18n/settings"
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session"

function setLocaleCookie(response: NextResponse, locale: string) {
  if (!response.cookies.get(localeCookieName)?.value) {
    response.cookies.set(localeCookieName, locale || fallbackLng, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  }
}

const PROTECTED_PREFIXES = ["/dashboard", "/post-login", "/admin", "/cliente"]

export async function updateSession(request: NextRequest) {
  const detectedLocale = resolveLanguage(
    request.cookies.get(localeCookieName)?.value ??
      request.headers.get("accept-language")?.split(",")[0],
  )
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  const token = request.cookies.get(COOKIE_NAME)?.value
  let session = null
  if (token) {
    try {
      session = await verifySessionToken(token)
    } catch {
      session = null
    }
  }

  if (isProtected && !session) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    const response = NextResponse.redirect(url)
    setLocaleCookie(response, detectedLocale)
    return response
  }

  // Já autenticado a ir para /login → redireciona para a área correcta
  if (session && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone()
    switch (session.role) {
      case "super_admin":
        url.pathname = "/admin"
        break
      case "client":
        url.pathname = "/cliente"
        break
      default:
        url.pathname = "/dashboard"
    }
    const response = NextResponse.redirect(url)
    setLocaleCookie(response, detectedLocale)
    return response
  }

  const response = NextResponse.next({ request })
  setLocaleCookie(response, detectedLocale)
  return response
}
