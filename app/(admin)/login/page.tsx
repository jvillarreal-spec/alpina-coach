'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error('Error de acceso: ' + error.message)
        } else {
            // Check if user is in admin_users table
            const { data: admin } = await supabase
                .from('admin_users')
                .select('email')
                .eq('email', email)
                .single()

            if (admin) {
                toast.success('Acceso concedido')
                router.push('/admin/dashboard')
            } else {
                await supabase.auth.signOut()
                toast.error('No tienes permisos de administrador')
            }
        }
        setIsLoading(false)
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#1B3A5C] p-4 text-white">
            <div className="mb-8 flex flex-col items-center gap-2">
                <ShieldCheck size={48} className="text-[#E87722]" />
                <h1 className="text-2xl font-bold">Panel Administrativo Alpina</h1>
            </div>

            <Card className="w-full max-w-md border-none shadow-2xl text-[#1A1A2E]">
                <CardHeader>
                    <CardTitle>Iniciar Sesión</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales autorizadas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email corporativo</label>
                            <Input
                                type="email"
                                placeholder="admin@alpina.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Contraseña</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-10 w-full bg-[#E87722] hover:bg-[#c6651d] font-bold"
                        >
                            {isLoading ? 'Verificando...' : 'Acceder'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
