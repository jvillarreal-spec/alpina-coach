'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        console.log('[LOGIN] Attempting Google OAuth login')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('[LOGIN] Google Auth Error:', error)
            toast.error('Error al iniciar sesión con Google: ' + error.message)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('[LOGIN] Attempting OTP login for:', email)
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                console.error('[LOGIN] Supabase Error:', error)
                toast.error('Error al enviar el enlace mágico: ' + error.message)
            } else {
                console.log('[LOGIN] Success: Magic Link sent')
                toast.success('¡Enlace enviado! Revisa tu correo electrónico.')
            }
        } catch (err: any) {
            console.error('[LOGIN] Unexpected Error:', err)
            toast.error('Ocurrió un error inesperado al intentar iniciar sesión.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFBFC] p-4">
            <div className="mb-8 flex flex-col items-center">
                {/* Usamos un placeholder para el logo de Alpina */}
                <div className="relative mb-4 h-24 w-48">
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#1B3A5C] text-2xl font-bold text-white">
                        ALPINA
                    </div>
                </div>
                <h1 className="text-xl font-bold text-[#1B3A5C]">Coach Nutricional</h1>
            </div>

            <Card className="w-full max-w-md border-none shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-[#1A1A2E]">Bienvenido</CardTitle>
                    <CardDescription>
                        Ingresa tu correo para recibir un enlace de acceso instantáneo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={handleGoogleLogin}
                        variant="outline"
                        className="w-full h-12 flex items-center justify-center gap-3 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continuar con Google
                    </Button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500 font-medium tracking-wider">O con tu correo</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 border-gray-200 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 w-full bg-[#1B3A5C] text-lg font-semibold hover:bg-[#132a44]"
                        >
                            {isLoading ? 'Enviando...' : 'Entrar'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="mt-8 text-center text-sm text-[#6B7280]">
                Al continuar, aceptas nuestros <strong>Términos y Condiciones</strong>.
            </p>
        </div>
    )
}
