import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: admin } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', user.email)
        .single()

    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Total users
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // Active today (users with food entries today)
    const today = new Date().toISOString().split('T')[0]
    const { data: activeToday } = await supabase
        .from('daily_summaries')
        .select('user_id')
        .eq('date', today)

    const activeCount = new Set(activeToday?.map(s => s.user_id)).size

    // Total food entries
    const { count: totalEntries } = await supabase
        .from('food_entries')
        .select('*', { count: 'exact', head: true })

    // Recommendations with Alpina products
    const { count: totalRecommendations } = await supabase
        .from('food_entries')
        .select('*', { count: 'exact', head: true })
        .not('alpina_product_recommended', 'is', null)

    // Distribution of goals
    const { data: goals } = await supabase
        .from('profiles')
        .select('goal')

    const goalDistribution = (goals || []).reduce((acc: any, curr) => {
        const goal = curr.goal || 'unknown'
        acc[goal] = (acc[goal] || 0) + 1
        return acc
    }, {})

    return NextResponse.json({
        metrics: {
            totalUsers: totalUsers || 0,
            activeToday: activeCount,
            totalEntries: totalEntries || 0,
            totalRecommendations: totalRecommendations || 0,
        },
        goalDistribution: Object.entries(goalDistribution).map(([name, value]) => ({ name, value }))
    })
}
