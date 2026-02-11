'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { calculateDailyCalories } from '@/lib/utils/calories'
import { toast } from 'sonner'
import { Check, Target, User, Calculator, Rocket, AlertTriangle } from 'lucide-react'
import { containsProfanity } from '@/lib/utils/validation'

type OnboardingData = {
    goal: 'lose_weight' | 'gain_weight' | 'eat_better' | 'fitness'
    current_weight: string
    target_weight: string
    sex: 'male' | 'female' | 'other'
    age_range: '18-25' | '26-35' | '36-45' | '46-55' | '56+'
    daily_calorie_target: number
    display_name: string
}

const steps = [
    { id: 1, title: 'Objetivo', icon: Target },
    { id: 2, title: 'Datos Básicos', icon: User },
    { id: 3, title: 'Meta Calórica', icon: Calculator },
    { id: 4, title: 'Confirmación', icon: Rocket },
]

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [data, setData] = useState<OnboardingData>({
        goal: 'eat_better',
        current_weight: '',
        target_weight: '',
        sex: 'female',
        age_range: '26-35',
        daily_calorie_target: 2000,
        display_name: '',
    })

    useEffect(() => {
        if (step === 3) {
            const calories = calculateDailyCalories({
                ...data,
                current_weight: parseFloat(data.current_weight) || 70,
                target_weight: parseFloat(data.target_weight) || 70,
            })
            setData((prev) => ({ ...prev, daily_calorie_target: calories }))
        }
    }, [step, data.current_weight, data.target_weight, data.goal, data.sex, data.age_range])

    const handleComplete = async () => {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            console.error('[ONBOARDING] Get user error:', userError)
            toast.error('No se pudo encontrar tu sesión de usuario.')
            return
        }

        console.log('[ONBOARDING] Attempting to save profile for:', user.id)
        const profileData = {
            id: user.id,
            email: user.email || '',
            goal: data.goal,
            current_weight: parseFloat(data.current_weight) || 0,
            target_weight: parseFloat(data.target_weight) || 0,
            sex: data.sex,
            age_range: data.age_range,
            daily_calorie_target: data.daily_calorie_target,
            display_name: data.display_name,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })

        if (error) {
            console.error('[ONBOARDING] Supabase Upsert Detailed Error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            toast.error(`Error al guardar: ${error.message || 'Error desconocido'} (${error.code || ''})`)
        } else {
            console.log('[ONBOARDING] Profile saved successfully')
            toast.success('¡Perfil completado!')
            router.push('/chat')
        }
    }

    const nextStep = () => setStep((s) => Math.min(s + 1, 4))
    const prevStep = () => setStep((s) => Math.max(s - 1, 1))

    return (
        <div className="flex min-h-screen flex-col bg-[#FAFBFC] p-4 pb-20">
            <div className="mx-auto w-full max-w-md pt-8">
                <div className="mb-8">
                    <Progress value={(step / 4) * 100} className="h-2 bg-gray-200" />
                    <div className="mt-4 flex justify-between">
                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= s.id ? 'bg-[#1B3A5C] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > s.id ? <Check size={16} /> : <s.icon size={16} />}
                                </div>
                                <span className={`mt-1 text-[10px] font-medium ${step >= s.id ? 'text-[#1B3A5C]' : 'text-gray-400'}`}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-[#1A1A2E]">
                            {step === 1 && '¿Cuál es tu objetivo nutricional?'}
                            {step === 2 && 'Cuéntanos un poco sobre ti'}
                            {step === 3 && 'Tu meta calórica diaria'}
                            {step === 4 && '¡Todo listo!'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {step === 1 && (
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'lose_weight', label: 'Bajar de peso', color: '#1B3A5C' },
                                    { id: 'gain_weight', label: 'Subir de peso', color: '#2E8B57' },
                                    { id: 'eat_better', label: 'Comer mejor', color: '#E87722' },
                                    { id: 'fitness', label: 'Mejorar mi fitness', color: '#1B3A5C' },
                                ].map((goal) => (
                                    <button
                                        key={goal.id}
                                        onClick={() => setData({ ...data, goal: goal.id as any })}
                                        className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all ${data.goal === goal.id ? 'border-[#1B3A5C] bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <span className="font-semibold text-[#1A1A2E]">{goal.label}</span>
                                        {data.goal === goal.id && <Check className="text-[#1B3A5C]" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">¿Cómo quieres que te llamemos?</label>
                                    <Input
                                        value={data.display_name}
                                        onChange={(e) => setData({ ...data, display_name: e.target.value })}
                                        placeholder="Tu nombre"
                                        className={containsProfanity(data.display_name) ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                    />
                                    {containsProfanity(data.display_name) && (
                                        <p className="text-[10px] text-red-500 flex items-center gap-1">
                                            <AlertTriangle size={10} /> Por favor usa un nombre apropiado.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Peso actual (kg)</label>
                                    <Input
                                        type="number"
                                        value={data.current_weight}
                                        onChange={(e) => setData({ ...data, current_weight: e.target.value })}
                                        placeholder="Ej. 70"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Peso deseado (kg)</label>
                                    <Input
                                        type="number"
                                        value={data.target_weight}
                                        onChange={(e) => setData({ ...data, target_weight: e.target.value })}
                                        placeholder="Ej. 65"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sexo</label>
                                    <Select value={data.sex} onValueChange={(v) => setData({ ...data, sex: v as any })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Masculino</SelectItem>
                                            <SelectItem value="female">Femenino</SelectItem>
                                            <SelectItem value="other">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rango de edad</label>
                                    <Select value={data.age_range} onValueChange={(v) => setData({ ...data, age_range: v as any })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
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
                        )}

                        {step === 3 && (
                            <div className="flex flex-col items-center py-6 text-center">
                                <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-blue-50 text-4xl font-bold text-[#1B3A5C]">
                                    {data.daily_calorie_target}
                                </div>
                                <p className="mb-2 font-semibold text-[#1A1A2E]">kcal al día</p>
                                <p className="text-sm text-[#6B7280]">
                                    Hemos calculado esto basándonos en tus datos. Puedes ajustarlo si lo prefieres.
                                </p>
                                <div className="mt-6 w-full space-y-2">
                                    <Input
                                        type="number"
                                        value={data.daily_calorie_target}
                                        onChange={(e) => setData({ ...data, daily_calorie_target: parseInt(e.target.value) })}
                                        className="text-center text-xl font-bold"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4">
                                <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Objetivo</span>
                                        <span className="text-sm font-semibold">{data.goal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Peso</span>
                                        <span className="text-sm font-semibold">{data.current_weight} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Meta calórica</span>
                                        <span className="text-sm font-semibold">{data.daily_calorie_target} kcal</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-4">
                                    <input type="checkbox" id="terms" required className="rounded border-gray-300" />
                                    <label htmlFor="terms" className="text-xs text-[#6B7280]">
                                        Acepto los términos y condiciones y la política de privacidad de Alpina Coach.
                                    </label>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex gap-3">
                        {step > 1 && (
                            <Button variant="outline" onClick={prevStep} className="flex-1">
                                Atrás
                            </Button>
                        )}
                        <Button
                            onClick={step === 4 ? handleComplete : nextStep}
                            className="flex-1 bg-[#1B3A5C]"
                            disabled={
                                (step === 2 && (!data.current_weight || !data.age_range || !data.display_name || containsProfanity(data.display_name))) ||
                                (step === 4 && containsProfanity(data.display_name))
                            }
                        >
                            {step === 4 ? 'Empezar' : 'Siguiente'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
