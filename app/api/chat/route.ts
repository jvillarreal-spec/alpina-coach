import { createClient } from '@/lib/supabase/server'
import { getCoachResponse } from '@/lib/ai/coach-agent'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, imageUrl } = await req.json()

    // Get profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get today's calories from summary
    const today = new Date().toISOString().split('T')[0]
    const { data: summary } = await supabase
        .from('daily_summaries')
        .select('total_calories')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

    // Get recent history
    const { data: history } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10) // Small history for performance

    const formattedHistory = (history || [])
        .reverse()
        .map((m: any) => ({ role: m.role, content: m.content }))

    // Call Agent
    const coachResult = await getCoachResponse({
        userId: user.id,
        userGoal: profile?.goal || 'eat_better',
        dailyTarget: profile?.daily_calorie_target || 2000,
        todayCalories: summary?.total_calories || 0,
        message,
        imageUrl,
        history: formattedHistory,
    })

    // Save user message
    await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: message,
        image_url: imageUrl || null
    })

    // Save assistant message
    await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: coachResult.text,
        metadata: {
            food_analysis: coachResult.foodAnalysis,
            alpina_recommendation: coachResult.alpinaRecommendation
        }
    })

    // If food analysis exists, log food entry
    if (coachResult.foodAnalysis) {
        const analysis = coachResult.foodAnalysis
        await supabase.from('food_entries').insert({
            user_id: user.id,
            food_name: analysis.food_name,
            calories: analysis.calories,
            protein: analysis.protein,
            carbs: analysis.carbs,
            fat: analysis.fat,
            source: imageUrl ? 'image' : 'text',
            image_url: imageUrl || null,
            alpina_product_recommended: coachResult.alpinaRecommendation?.product_name || null
        })

        // Update daily summary (Simplified: ideally use a DB trigger)
        const { data: currentSummary } = await supabase
            .from('daily_summaries')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single()

        if (currentSummary) {
            await supabase.from('daily_summaries').update({
                total_calories: currentSummary.total_calories + analysis.calories,
                total_protein: Number(currentSummary.total_protein) + analysis.protein,
                total_carbs: Number(currentSummary.total_carbs) + analysis.carbs,
                total_fat: Number(currentSummary.total_fat) + analysis.fat,
                entries_count: currentSummary.entries_count + 1
            }).eq('id', currentSummary.id)
        } else {
            await supabase.from('daily_summaries').insert({
                user_id: user.id,
                date: today,
                total_calories: analysis.calories,
                total_protein: analysis.protein,
                total_carbs: analysis.carbs,
                total_fat: analysis.fat,
                entries_count: 1
            })
        }
    }

    return NextResponse.json(coachResult)
}
