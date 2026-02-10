import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake can make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()

    // Admin protection
    if (url.pathname.startsWith('/admin')) {
        if (!user) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        const { data: admin } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', user.email)
            .single()

        if (!admin) {
            url.pathname = '/chat'
            return NextResponse.redirect(url)
        }
    }

    // Consumer protection
    if (!user && !url.pathname.startsWith('/login')) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && url.pathname.startsWith('/login')) {
        url.pathname = '/chat'
        return NextResponse.redirect(url)
    }

    // Onboarding check
    if (user && !url.pathname.startsWith('/onboarding') && !url.pathname.startsWith('/admin')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        if (profile && !profile.onboarding_completed) {
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
