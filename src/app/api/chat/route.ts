import { createClient } from '@/lib/supabase/server'
import { getCoachResponse } from '@/lib/ai/coach-agent'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, imageUrl, date } = await req.json()
    const today = date || new Date().toISOString().split('T')[0]
    console.log('[CHAT API] New request:', { userId: user.id, message, hasImage: !!imageUrl, date: today })

    // Get profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
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
        .map((m: any) => ({
            role: m.role,
            content: m.content || (m.role === 'user' ? '[Imagen enviada]' : '...')
        }))

    console.log('[CHAT API] Calling agent...')
    try {
        const coachResult = await getCoachResponse({
            userId: user.id,
            userName: profile?.display_name || 'Usuario',
            userGoal: profile?.goal || 'eat_better',
            dailyTarget: profile?.daily_calorie_target || 2000,
            todayCalories: summary?.total_calories || 0,
            message,
            imageUrl,
            history: formattedHistory,
        })
        console.log('[CHAT API] Agent success')

        // Save user message (Ensure content is not empty)
        const savedMessage = message || (imageUrl ? '[Imagen enviada]' : 'Prueba de registro')
        const { error: userMsgErr } = await supabase.from('chat_messages').insert({
            user_id: user.id,
            role: 'user',
            content: savedMessage,
            image_url: imageUrl || null
        })
        if (userMsgErr) console.error('[CHAT API] User message save error:', userMsgErr)

        // Save assistant message
        const { error: asstMsgErr } = await supabase.from('chat_messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: coachResult.text,
            metadata: {
                food_analysis: coachResult.foodAnalysis,
                alpina_recommendation: coachResult.alpinaRecommendation
            }
        })
        if (asstMsgErr) console.error('[CHAT API] Assistant message save error:', asstMsgErr)

        // If food analysis exists, log food entry
        if (coachResult.foodAnalysis) {
            console.log('[CHAT API] Saving food entry...')
            const analysis = coachResult.foodAnalysis
            const { error: foodEntryErr } = await supabase.from('food_entries').insert({
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
            if (foodEntryErr) console.error('[CHAT API] Food entry save error:', foodEntryErr)

            // Update daily summary
            console.log('[CHAT API] Updating summary...')
            const { data: currentSummary, error: fetchErr } = await supabase
                .from('daily_summaries')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle()

            if (fetchErr) console.error('[CHAT API] Fetch summary error:', fetchErr)

            if (currentSummary) {
                const { error: updateErr } = await supabase.from('daily_summaries').update({
                    total_calories: (currentSummary.total_calories || 0) + analysis.calories,
                    total_protein: Number(currentSummary.total_protein || 0) + analysis.protein,
                    total_carbs: Number(currentSummary.total_carbs || 0) + analysis.carbs,
                    total_fat: Number(currentSummary.total_fat || 0) + analysis.fat,
                    entries_count: (currentSummary.entries_count || 0) + 1
                }).eq('id', currentSummary.id)
                if (updateErr) console.error('[CHAT API] Summary update error:', updateErr)
            } else {
                const { error: insertErr } = await supabase.from('daily_summaries').insert({
                    user_id: user.id,
                    date: today,
                    total_calories: analysis.calories,
                    total_protein: analysis.protein,
                    total_carbs: analysis.carbs,
                    total_fat: analysis.fat,
                    entries_count: 1
                })
                if (insertErr) console.error('[CHAT API] Summary insert error:', insertErr)
            }
        }

        return NextResponse.json(coachResult)
    } catch (error: any) {
        console.error('[CHAT API] FATAL ERROR:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
