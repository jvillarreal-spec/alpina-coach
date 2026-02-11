import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './system-prompt'
import alpinaProducts from '@/data/alpina-products.json'
import colombianFoods from '@/data/colombian-foods.json'
import { FoodAnalysis, AlpinaRecommendation } from '@/types'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function getCoachResponse(params: {
    userId: string
    userName: string
    userGoal: string
    dailyTarget: number
    todayCalories: number
    message: string
    imageUrl?: string
    history: { role: 'user' | 'assistant'; content: string }[]
}) {
    const { userName, userGoal, dailyTarget, todayCalories, message, imageUrl, history } = params

    const filledPrompt = SYSTEM_PROMPT
        .replace('{{USER_NAME}}', userName)
        .replace('{{USER_GOAL}}', userGoal)
        .replace('{{DAILY_CALORIE_TARGET}}', dailyTarget.toString())
        .replace('{{TODAY_CALORIES}}', todayCalories.toString())
        .replace('{{ALPINA_CATALOG}}', JSON.stringify(alpinaProducts.slice(0, 15), null, 2)) // Subset to save context
        .replace('{{COLOMBIAN_FOODS}}', JSON.stringify(colombianFoods.slice(0, 20), null, 2))

    const messages: Anthropic.MessageParam[] = history.map((h) => ({
        role: h.role,
        content: h.content,
    }))

    const content: Anthropic.ContentBlockParam[] = []

    if (message.trim()) {
        content.push({ type: 'text', text: message })
    }

    if (imageUrl) {
        console.log('[AGENT] Processing image data...')
        try {
            const base64Data = imageUrl.split(',')[1]
            const mediaType = imageUrl.split(';')[0].split(':')[1] as any

            content.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data,
                },
            })
        } catch (e) {
            console.error('[AGENT] Error processing image:', e)
        }
    }

    // Anthropic works better if there's always a text block in the request
    const hasText = content.some(c => c.type === 'text')
    if (!hasText) {
        content.push({ type: 'text', text: "Analiza esta imagen y identifica los alimentos presentes para mi registro nutricional." })
    }

    console.log('[AGENT] Sending request to Anthropic...')
    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: filledPrompt,
            messages: [...messages, { role: 'user', content }],
        })
        console.log('[AGENT] Anthropic response received')

        const textResponse = (response.content[0] as any).text
        console.log('[AGENT] Raw Response:', textResponse.substring(0, 100) + '...')


        // Parse tags
        const foodAnalysis = parseTag<FoodAnalysis>(textResponse, 'food_analysis')
        const alpinaRecommendation = parseTag<AlpinaRecommendation>(textResponse, 'alpina_recommendation')

        // Clean text response
        const cleanResponse = textResponse
            .replace(/<food_analysis>[\s\S]*?<\/food_analysis>/g, '')
            .replace(/<alpina_recommendation>[\s\S]*?<\/alpina_recommendation>/g, '')
            .trim()

        return {
            text: cleanResponse,
            foodAnalysis,
            alpinaRecommendation,
        }
    } catch (error: any) {
        console.error('[AGENT] Anthropic API Error:', error)
        throw error
    }
}

function parseTag<T>(text: string, tagName: string): T | null {
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\/${tagName}>`)
    const match = text.match(regex)
    if (match && match[1]) {
        try {
            return JSON.parse(match[1].trim())
        } catch (e) {
            console.error(`Failed to parse ${tagName}`, e)
            return null
        }
    }
    return null
}
