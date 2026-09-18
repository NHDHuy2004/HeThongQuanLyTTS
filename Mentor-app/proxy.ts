import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = /^\/mentor-app(\/|$)/
const AUTH_ROUTES = ['/login']

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie))
  return to
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const pathname = request.nextUrl.pathname
  const isProtectedRoute = PROTECTED_ROUTES.test(pathname)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return copyCookies(response, NextResponse.redirect(url))
  }

  if (user && (isProtectedRoute || isAuthRoute)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role ?? null

    if (isAuthRoute) {
      if (userRole === 'mentor') {
        return copyCookies(response, NextResponse.redirect(new URL('/mentor-app/home', request.url)))
      }
      if (userRole) {
        return copyCookies(response, NextResponse.redirect(new URL(`/${userRole}`, request.url)))
      }
      return response
    }

    if (isProtectedRoute && userRole !== 'mentor') {
      const url = userRole
        ? new URL(`/${userRole}`, request.url)
        : new URL('/login', request.url)
      return copyCookies(response, NextResponse.redirect(url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
