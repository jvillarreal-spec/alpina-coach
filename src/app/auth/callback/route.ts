import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/chat'

    console.log('[AUTH CALLBACK] Received request. Origin:', origin)

    if (code) {
        const supabase = await createClient()
        console.log('[AUTH CALLBACK] Exchanging code for session...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('[AUTH CALLBACK] Exchange successful.')

            // For production robustness (Vercel), we build the redirect URL
            // Ensure we use the domain the request is coming from
            const redirectUrl = new URL(next, request.url)

            // Log final destination
            console.log('[AUTH CALLBACK] Stable redirecting to:', redirectUrl.toString())
            return NextResponse.redirect(redirectUrl)
        } else {
            console.error('[AUTH CALLBACK] Exchange error:', error.message)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
        }
    }

    console.warn('[AUTH CALLBACK] No code provided in query params')
    return NextResponse.redirect(`${origin}/login?error=no_auth_code`)
}
