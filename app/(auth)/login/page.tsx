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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            toast.error('Error al enviar el enlace mágico: ' + error.message)
        } else {
            toast.success('¡Enlace enviado! Revisa tu correo electrónico.')
        }
        setIsLoading(false)
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
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(email)}
                                required
                                className="h-12 border-gray-200 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 w-full bg-[#1B3A5C] text-lg font-semibold hover:bg-[#132a44]"
                        >
                            {isLoading ? 'Enviando...' : 'Continuar'}
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
