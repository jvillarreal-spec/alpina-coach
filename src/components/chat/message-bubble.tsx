import { AlpinaRecommendation } from '@/types'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import Image from 'next/image'

interface MessageProps {
    role: 'user' | 'assistant'
    content: string
    imageUrl?: string
    recommendation?: AlpinaRecommendation | null
}

export function MessageBubble({ role, content, imageUrl, recommendation }: MessageProps) {
    const isUser = role === 'user'

    return (
        <div className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}>
            {imageUrl && (
                <div className="relative mb-2 h-48 w-64 overflow-hidden rounded-2xl border bg-gray-100 shadow-sm">
                    <img src={imageUrl} alt="Food" className="h-full w-full object-cover" />
                </div>
            )}

            <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 border-2 shadow-md ${isUser
                    ? 'bg-[#1B3A5C] text-white rounded-tr-none'
                    : 'bg-white border text-[#1A1A2E] rounded-tl-none'
                    }`}
            >
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{content}</p>
            </div>

            {recommendation && (
                <Card className="mt-3 w-[98%] border-[#E87722] bg-[#FFF8F3] rounded-2xl overflow-hidden shadow-md">
                    <CardContent className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <Badge className="bg-[#E87722] hover:bg-[#E87722]">Recomendado por tu coach</Badge>
                            <span className="text-[10px] font-bold text-[#E87722]">ALPINA</span>
                        </div>
                        <h4 className="font-bold text-[#1A1A2E]">{recommendation.product_name}</h4>
                        <p className="mt-1 text-xs text-[#6B7280] italic">{recommendation.reason}</p>
                        <div className="mt-3 flex gap-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            <span>{recommendation.calories} kcal</span>
                            <span>{recommendation.protein}g Prot</span>
                            <span>{recommendation.carbs}g Carb</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
