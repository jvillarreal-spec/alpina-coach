'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, subDays, startOfDay, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Camera, Utensils } from 'lucide-react'
import { getTodayDateString } from '@/lib/utils/dates'
import Link from 'next/link'

export default function SummaryPage() {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [profile, setProfile] = useState<any>(null)
    const [summary, setSummary] = useState<any>(null)
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [selectedDate])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(profile)

        // Load summary for date
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const { data: summary } = await supabase
            .from('daily_summaries')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', dateStr)
            .single()
        setSummary(summary)

        // Load entries for date
        const start = startOfDay(selectedDate).toISOString()
        const end = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
        const { data: entries } = await supabase
            .from('food_entries')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', start)
            .lt('created_at', end)
            .order('created_at', { ascending: false })

        setEntries(entries || [])
        setLoading(false)
    }

    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse()

    const calorieTarget = profile?.daily_calorie_target || 2000
    const caloriesConsumed = entries.reduce((acc, entry) => acc + (entry.calories || 0), 0)
    const caloriesRemaining = Math.max(calorieTarget - caloriesConsumed, 0)
    const caloriePercentage = Math.min((caloriesConsumed / calorieTarget) * 100, 100)

    const totalProtein = entries.reduce((acc, entry) => acc + (Number(entry.protein) || 0), 0)
    const totalCarbs = entries.reduce((acc, entry) => acc + (Number(entry.carbs) || 0), 0)
    const totalFat = entries.reduce((acc, entry) => acc + (Number(entry.fat) || 0), 0)

    // Macro targets (estimados basados en porcentajes estándar 40% carb, 30% prot, 30% fat)
    const proteinTarget = Math.round((calorieTarget * 0.3) / 4)
    const carbTarget = Math.round((calorieTarget * 0.4) / 4)
    const fatTarget = Math.round((calorieTarget * 0.3) / 9)

    return (
        <div className="flex min-h-screen flex-col bg-[#FAFBFC] p-4">
            <header className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Mi Progreso</h1>
                <div className="h-10 w-10 overflow-hidden rounded-full bg-[#1B3A5C] flex items-center justify-center text-[10px] font-bold text-white">
                    ALPINA
                </div>
            </header>

            {/* Date Selector */}
            <div className="mb-8 flex justify-between overflow-x-auto pb-2 gap-2 scrollbar-hide">
                {days.map((day) => {
                    const isSelected = isSameDay(day, selectedDate)
                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={`flex min-w-[50px] flex-col items-center rounded-2xl py-3 transition-all ${isSelected ? 'bg-[#1B3A5C] text-white shadow-md' : 'bg-white text-gray-400'
                                }`}
                        >
                            <span className="text-[10px] uppercase font-bold">{format(day, 'eee', { locale: es })}</span>
                            <span className="text-lg font-bold">{format(day, 'd')}</span>
                        </button>
                    )
                })}
            </div>

            {loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B3A5C] border-t-transparent" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Calorie Progress Card */}
                    <Card className="border-none bg-white shadow-lg overflow-hidden relative">
                        <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-50 opacity-50" />
                        <CardContent className="pt-8 pb-8">
                            <div className="flex flex-col items-center">
                                <div className="relative flex h-48 w-48 items-center justify-center">
                                    <svg className="h-full w-full rotate-[-90deg]">
                                        <circle
                                            cx="96"
                                            cy="96"
                                            r="88"
                                            stroke="#E5E7EB"
                                            strokeWidth="12"
                                            fill="transparent"
                                        />
                                        <circle
                                            cx="96"
                                            cy="96"
                                            r="88"
                                            stroke="#1B3A5C"
                                            strokeWidth="12"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 88}
                                            strokeDashoffset={2 * Math.PI * 88 * (1 - caloriePercentage / 100)}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-4xl font-extrabold text-[#1A1A2E]">{caloriesRemaining}</span>
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Restantes</span>
                                    </div>
                                </div>

                                <div className="mt-8 flex w-full justify-around">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400">Meta</p>
                                        <p className="font-bold text-[#1A1A2E]">{calorieTarget} kcal</p>
                                    </div>
                                    <div className="h-10 w-px bg-gray-100" />
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400">Consumidas</p>
                                        <p className="font-bold text-[#1B3A5C]">{caloriesConsumed} kcal</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Macros Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Macronutrientes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MacroProgress
                                label="Proteína"
                                current={totalProtein}
                                target={proteinTarget}
                                color="#1B3A5C"
                            />
                            <MacroProgress
                                label="Carbohidratos"
                                current={totalCarbs}
                                target={carbTarget}
                                color="#E87722"
                            />
                            <MacroProgress
                                label="Grasa"
                                current={totalFat}
                                target={fatTarget}
                                color="#2E8B57"
                            />
                        </CardContent>
                    </Card>

                    {/* History List */}
                    <div>
                        <h2 className="mb-4 text-lg font-bold text-[#1A1A2E]">Comidas del día</h2>
                        {entries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-12 text-center shadow-sm border border-dashed border-gray-200">
                                <Utensils className="mb-3 text-gray-200" size={48} />
                                <p className="mb-4 text-gray-400 px-8">No has registrado alimentos hoy.</p>
                                <Link href="/chat">
                                    <Button className="bg-[#1B3A5C] rounded-full px-6">Ir al chat</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {entries.map((entry) => (
                                    <div key={entry.id} className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${entry.source === 'image' ? 'bg-orange-50 text-[#E87722]' : 'bg-blue-50 text-[#1B3A5C]'}`}>
                                            {entry.source === 'image' ? <Camera size={20} /> : <Utensils size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#1A1A2E] text-sm">{entry.food_name}</h4>
                                            <p className="text-[10px] text-gray-400">{format(new Date(entry.created_at), 'hh:mm aa')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#1A1A2E] text-sm">{entry.calories} kcal</p>
                                            {entry.protein && <p className="text-[10px] text-gray-400">{entry.protein}g P / {entry.carbs}g C / {entry.fat}g G</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function MacroProgress({ label, current, target, color }: { label: string, current: number, target: number, color: string }) {
    const percentage = Math.min((current / target) * 100, 100)
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-600">{label}</span>
                <span className="font-bold text-[#1A1A2E]">{Math.round(current)}g / {target}g</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
        </div>
    )
}
