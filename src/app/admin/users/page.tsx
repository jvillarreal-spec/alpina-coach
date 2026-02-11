'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        let query = supabase.from('profiles').select('*')

        if (search) {
            query = query.ilike('email', `%${search}%`)
        }

        const { data } = await query.order('created_at', { ascending: false })
        setUsers(data || [])
        setLoading(false)
    }

    const exportCSV = () => {
        const headers = ['Email', 'Objetivo', 'Peso Inicial', 'Meta Calórica', 'Registro']
        const rows = users.map(u => [
            u.email,
            u.goal,
            u.current_weight,
            u.daily_calorie_target,
            format(new Date(u.created_at), 'yyyy-MM-dd')
        ])

        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `usuarios_alpina_coach_${format(new Date(), 'yyyyMMdd')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="flex h-16 items-center justify-between border-b bg-white px-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-[#1A1A2E]">Gestión de Usuarios</h1>
                </div>
                <nav className="flex gap-4">
                    {/* ... reuse nav from dashboard or layout ... */}
                </nav>
            </header>

            <main className="p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Buscar por email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={exportCSV} variant="outline" className="gap-2">
                        <Download size={18} /> Exportar CSV
                    </Button>
                </div>

                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 uppercase text-[10px] font-bold text-gray-400">
                                <TableHead>Usuario</TableHead>
                                <TableHead>Objetivo</TableHead>
                                <TableHead>Peso</TableHead>
                                <TableHead>Meta Calórica</TableHead>
                                <TableHead>Fecha Registro</TableHead>
                                <TableHead className="text-right">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-gray-400">Cargando usuarios...</TableCell></TableRow>
                            ) : users.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-gray-400">No se encontraron usuarios.</TableCell></TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-gray-50">
                                        <TableCell className="font-semibold text-[#1A1A2E]">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{user.goal?.replace('_', ' ')}</Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500 font-medium">{user.current_weight} kg</TableCell>
                                        <TableCell className="text-[#1B3A5C] font-bold">{user.daily_calorie_target} kcal</TableCell>
                                        <TableCell className="text-gray-400 text-xs">{format(new Date(user.created_at), 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            {user.onboarding_completed ? (
                                                <Badge className="bg-[#2E8B57]">Activo</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pendiente</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    )
}
