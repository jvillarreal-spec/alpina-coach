'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageBubble } from '@/components/chat/message-bubble'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Camera, Send, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getTodayDateString } from '@/lib/utils/dates'

export default function ChatPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [todayCalories, setTodayCalories] = useState(0)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchData()
        loadMessages()
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(profile)

        const today = getTodayDateString()
        const { data: summary } = await supabase
            .from('daily_summaries')
            .select('total_calories')
            .eq('user_id', user.id)
            .eq('date', today)
            .single()

        setTodayCalories(summary?.total_calories || 0)
    }

    const loadMessages = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: chatMessages } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

        if (chatMessages) setMessages(chatMessages)
    }

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if ((!input.trim() && !selectedImage) || isLoading) return

        const currentInput = input
        const currentImage = selectedImage
        setInput('')
        setSelectedImage(null)
        setIsLoading(true)

        // Optimistic UI for user message
        const tempUserMsg = { role: 'user', content: currentInput, image_url: currentImage }
        setMessages(prev => [...prev, tempUserMsg])

        try {
            const localDate = getTodayDateString()
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput,
                    imageUrl: currentImage,
                    date: localDate
                }),
            })

            const data = await res.json()

            if (data.error) throw new Error(data.error)

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.text,
                metadata: {
                    food_analysis: data.foodAnalysis,
                    alpina_recommendation: data.alpinaRecommendation
                }
            }])

            if (data.foodAnalysis) {
                setTodayCalories(prev => prev + data.foodAnalysis.calories)
                toast.success(`Registrado: ${data.foodAnalysis.food_name} (+${data.foodAnalysis.calories} kcal)`)
            }
        } catch (err: any) {
            toast.error('Error al contactar al coach: ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 4 * 1024 * 1024) {
            toast.error('La imagen es muy grande (máx 4MB)')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            setSelectedImage(event.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const caloriePercentage = profile?.daily_calorie_target
        ? Math.min((todayCalories / profile.daily_calorie_target) * 100, 100)
        : 0

    const getProgressColor = () => {
        if (caloriePercentage < 80) return 'bg-[#2E8B57]' // Green
        if (caloriePercentage < 100) return 'bg-[#E87722]' // Orange
        return 'bg-[#DC2626]' // Red
    }

    return (
        <div className="flex h-screen flex-col">
            {/* Header with Progress */}
            <header className="sticky top-0 z-40 bg-white px-4 py-3 shadow-sm">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#1B3A5C] flex items-center justify-center text-[10px] font-bold text-white">
                            ALPINA
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col items-end px-4">
                        <div className="mb-1 flex gap-1 text-[10px] font-bold text-[#1A1A2E]">
                            <span className="text-[#1B3A5C]">{todayCalories}</span>
                            <span className="text-gray-400">/ {profile?.daily_calorie_target || 2000} kcal</span>
                        </div>
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className={`h-full transition-all duration-500 ${getProgressColor()}`}
                                style={{ width: `${caloriePercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto bg-[#FAFBFC] p-4 pb-32"
            >
                <div className="mx-auto max-w-6xl space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <div className="mb-4 w-full flex items-center justify-center text-[#1B3A5C]">
                                <MessageBubble role="assistant" content="¡Hola! Soy tu Coach de Alpina. ¿Qué has comido hoy?" />
                            </div>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <MessageBubble
                            key={i}
                            role={m.role}
                            content={m.content}
                            imageUrl={m.image_url}
                            recommendation={m.metadata?.alpina_recommendation}
                        />
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Loader2 className="animate-spin" size={16} />
                            <span>El coach está pensando...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-white p-4">
                <form
                    onSubmit={handleSend}
                    className="mx-auto flex max-w-6xl items-end gap-2"
                >
                    <div className="relative flex-1 overflow-hidden rounded-2xl border-2 border-gray-100 bg-gray-50 transition-all focus-within:border-[#1B3A5C]">
                        {selectedImage && (
                            <div className="relative p-2">
                                <img src={selectedImage} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white shadow-sm"
                                >
                                    <Plus size={12} className="rotate-45" />
                                </button>
                            </div>
                        )}
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe algo o envía una foto..."
                            className="border-none bg-transparent shadow-none focus-visible:ring-0"
                        />
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12 w-12 rounded-full text-gray-500"
                    >
                        <Camera size={24} />
                    </Button>
                    <Button
                        type="submit"
                        disabled={(!input.trim() && !selectedImage) || isLoading}
                        className="h-12 w-12 rounded-full bg-[#1B3A5C] p-0"
                    >
                        <Send size={20} />
                    </Button>
                </form>
            </div>
        </div>
    )
}
