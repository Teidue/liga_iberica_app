import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value
  const role = request.cookies.get('auth_role')?.value

  const isAdminRoute = pathname.startsWith('/admin')
  const isTeamRoute = pathname.startsWith('/team')
  const isLoginPage = pathname === '/login'

  // Unauthenticated user tries to access a protected route
  if ((isAdminRoute || isTeamRoute) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // TEAM_ADMIN tries to access SUPER_ADMIN routes
  if (isAdminRoute && token && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/team', request.url))
  }

  // SUPER_ADMIN tries to access TEAM_ADMIN routes
  if (isTeamRoute && token && role !== 'TEAM_ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Already authenticated user visits /login
  if (isLoginPage && token) {
    const dest = role === 'SUPER_ADMIN' ? '/admin' : '/team'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/team/:path*', '/login'],
}
