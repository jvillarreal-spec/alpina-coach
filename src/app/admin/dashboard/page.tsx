'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, Users, Utensils, Award, PieChart as PieChartIcon, LogOut } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const COLORS = ['#1B3A5C', '#E87722', '#2E8B57', '#6B7280']

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchMetrics()
    }, [])

    const fetchMetrics = async () => {
        const res = await fetch('/api/admin/metrics')
        if (res.ok) {
            const json = await res.json()
            setData(json)
        }
        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando métricas...</div>

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="flex h-16 items-center justify-between border-b bg-white px-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B3A5C] text-[10px] font-bold text-white">
                        ALPINA
                    </div>
                    <h1 className="text-lg font-bold text-[#1A1A2E]">Admin Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <nav className="flex gap-6 mr-8">
                        <Button variant="ghost" onClick={() => router.push('/admin/dashboard')} className="font-semibold text-[#1B3A5C]">Dashboard</Button>
                        <Button variant="ghost" onClick={() => router.push('/admin/users')}>Usuarios</Button>
                    </nav>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600">
                        <LogOut size={16} className="mr-2" /> Salir
                    </Button>
                </div>
            </header>

            <main className="p-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Usuarios"
                        value={data?.metrics?.totalUsers}
                        icon={<Users className="text-[#1B3A5C]" />}
                        label="Registrados"
                    />
                    <MetricCard
                        title="Activos Hoy"
                        value={data?.metrics?.activeToday}
                        icon={<Layers className="text-[#2E8B57]" />}
                        label="Usuarios únicos"
                    />
                    <MetricCard
                        title="Alimentos Analizados"
                        value={data?.metrics?.totalEntries}
                        icon={<Utensils className="text-[#E87722]" />}
                        label="Entradas totales"
                    />
                    <MetricCard
                        title="Recomendaciones"
                        value={data?.metrics?.totalRecommendations}
                        icon={<Award className="text-blue-400" />}
                        label="Productos Alpina"
                    />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Goals Chart */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-md">
                                <PieChartIcon size={20} className="text-[#1B3A5C]" />
                                Distribución de Objetivos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data?.goalDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data?.goalDistribution?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {data?.goalDistribution?.map((entry: any, index: number) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[10px] font-medium text-gray-500 uppercase">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Overload Placeholder */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-md">Actividad Reciente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                <p>Gráfico de actividad temporal (Próximamente)</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

function MetricCard({ title, value, icon, label }: { title: string, value: number, icon: React.ReactNode, label: string }) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                </div>
                <div className="mt-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase">{title}</h3>
                    <p className="mt-1 text-3xl font-extrabold text-[#1A1A2E]">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
