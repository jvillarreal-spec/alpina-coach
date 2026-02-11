'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BottomNav } from '@/components/ui/bottom-nav'
import { calculateDailyCalories } from '@/lib/utils/calories'
import { toast } from 'sonner'
import { LogOut, Save, User as UserIcon, Target, Scale, Calendar, Calculator } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ProfileData = {
    goal: 'lose_weight' | 'gain_weight' | 'eat_better' | 'fitness'
    current_weight: string
    target_weight: string
    sex: 'male' | 'female' | 'other'
    age_range: '18-25' | '26-35' | '36-45' | '46-55' | '56+'
    daily_calorie_target: number
}

export default function ProfilePage() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [data, setData] = useState<ProfileData>({
        goal: 'eat_better',
        current_weight: '',
        target_weight: '',
        sex: 'female',
        age_range: '26-35',
        daily_calorie_target: 2000,
    })

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) {
                console.error('[PROFILE] Error loading profile:', error)
                toast.error('Error al cargar tu perfil')
            } else if (profile) {
                setData({
                    goal: profile.goal || 'eat_better',
                    current_weight: profile.current_weight?.toString() || '',
                    target_weight: profile.target_weight?.toString() || '',
                    sex: profile.sex || 'female',
                    age_range: profile.age_range || '26-35',
                    daily_calorie_target: profile.daily_calorie_target || 2000,
                })
            }
            setIsLoading(false)
        }
        loadProfile()
    }, [supabase, router])

    // Recalculate calories when data changes
    useEffect(() => {
        if (!isLoading) {
            const calories = calculateDailyCalories({
                ...data,
                current_weight: parseFloat(data.current_weight) || 70,
                target_weight: parseFloat(data.target_weight) || 70,
            })
            if (calories !== data.daily_calorie_target) {
                setData((prev) => ({ ...prev, daily_calorie_target: calories }))
            }
        }
    }, [data.current_weight, data.target_weight, data.goal, data.sex, data.age_range, isLoading])

    const handleSave = async () => {
        setIsSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('profiles')
            .update({
                goal: data.goal,
                current_weight: parseFloat(data.current_weight) || 0,
                target_weight: parseFloat(data.target_weight) || 0,
                sex: data.sex,
                age_range: data.age_range,
                daily_calorie_target: data.daily_calorie_target,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (error) {
            console.error('[PROFILE] Error updating profile:', error)
            toast.error('Error al actualizar el perfil')
        } else {
            toast.success('¡Perfil actualizado con éxito!')
        }
        setIsSaving(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        toast.success('Sesión cerrada')
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#FAFBFC]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B3A5C] border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#FAFBFC] pb-24">
            {/* Header */}
            <header className="bg-white px-6 py-8 shadow-sm">
                <div className="mx-auto max-w-md flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1B3A5C]">Mi Perfil</h1>
                        <p className="text-sm text-gray-500 text-balance">Configura tus metas y datos personales</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                        <LogOut size={20} />
                    </Button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-md flex-1 p-4 space-y-6">
                {/* Metas Nutritionales */}
                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-[#1B3A5C] text-white py-4">
                        <div className="flex items-center gap-2">
                            <Target size={18} />
                            <CardTitle className="text-lg">Tu Objetivo</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'lose_weight', label: 'Bajar de peso' },
                                { id: 'gain_weight', label: 'Subir de peso' },
                                { id: 'eat_better', label: 'Comer mejor' },
                                { id: 'fitness', label: 'Mejorar mi fitness' },
                            ].map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => setData({ ...data, goal: goal.id as any })}
                                    className={`flex items-center justify-between rounded-xl border-2 p-3 transition-all ${data.goal === goal.id ? 'border-[#1B3A5C] bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <span className="text-sm font-semibold text-[#1A1A2E]">{goal.label}</span>
                                    {data.goal === goal.id && <div className="h-2 w-2 rounded-full bg-[#1B3A5C]" />}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Datos Personales */}
                <Card className="border-none shadow-md">
                    <CardHeader className="py-4 border-b">
                        <div className="flex items-center gap-2 text-[#1B3A5C]">
                            <UserIcon size={18} />
                            <CardTitle className="text-lg">Datos Personales</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                    <Scale size={12} /> Peso Actual (kg)
                                </label>
                                <Input
                                    type="number"
                                    value={data.current_weight}
                                    onChange={(e) => setData({ ...data, current_weight: e.target.value })}
                                    className="bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-[#1B3A5C]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                    <Target size={12} /> Meta (kg)
                                </label>
                                <Input
                                    type="number"
                                    value={data.target_weight}
                                    onChange={(e) => setData({ ...data, target_weight: e.target.value })}
                                    className="bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-[#1B3A5C]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Sexo</label>
                                <Select value={data.sex} onValueChange={(v) => setData({ ...data, sex: v as any })}>
                                    <SelectTrigger className="bg-gray-50 border-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Masculino</SelectItem>
                                        <SelectItem value="female">Femenino</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                    <Calendar size={12} /> Edad
                                </label>
                                <Select value={data.age_range} onValueChange={(v) => setData({ ...data, age_range: v as any })}>
                                    <SelectTrigger className="bg-gray-50 border-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="18-25">18-25</SelectItem>
                                        <SelectItem value="26-35">26-35</SelectItem>
                                        <SelectItem value="36-45">36-45</SelectItem>
                                        <SelectItem value="46-55">46-55</SelectItem>
                                        <SelectItem value="56+">56+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Nutricional */}
                <Card className="border-none shadow-md bg-gradient-to-br from-[#1B3A5C] to-[#2A5298] text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-medium opacity-80">Tu meta calórica diaria</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-3xl font-bold">{data.daily_calorie_target}</span>
                                    <span className="text-sm opacity-80 uppercase tracking-wider font-semibold italic">kcal</span>
                                </div>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <Calculator size={24} />
                            </div>
                        </div>
                        <p className="mt-4 text-[10px] opacity-70 leading-relaxed">
                            Calculamos esto automáticamente basándonos en tu objetivo y metabolismo basal. Si ya tienes un plan nutricional médico, puedes editarlo aquí abajo.
                        </p>
                        <div className="mt-4">
                            <Input
                                type="number"
                                value={data.daily_calorie_target}
                                onChange={(e) => setData({ ...data, daily_calorie_target: parseInt(e.target.value) || 0 })}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 h-8 text-center font-bold"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button
                    onClick={handleSave}
                    className="w-full h-14 bg-[#1B3A5C] text-lg font-bold shadow-lg shadow-[#1B3A5C]/20 hover:bg-[#2A5298] transition-all"
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <Save size={20} />
                            Guardar Cambios
                        </div>
                    )}
                </Button>
            </main>

            <BottomNav />
        </div>
    )
}
