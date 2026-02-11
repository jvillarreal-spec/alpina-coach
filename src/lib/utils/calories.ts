export type ProfileData = {
    goal: 'lose_weight' | 'gain_weight' | 'eat_better' | 'fitness'
    current_weight: number
    target_weight?: number
    sex: 'male' | 'female' | 'other'
    age_range: '18-25' | '26-35' | '36-45' | '46-55' | '56+'
}

export function calculateDailyCalories(data: ProfileData): number {
    // Map age range to a middle value
    const ageMap: Record<string, number> = {
        '18-25': 22,
        '26-35': 30,
        '36-45': 40,
        '46-55': 50,
        '56+': 65,
    }

    const age = ageMap[data.age_range] || 30
    const weight = data.current_weight

    // Simplified BMR calculation (Harris-Benedict)
    // Assuming average height (170cm for M, 160cm for F)
    let bmr = 0
    if (data.sex === 'female') {
        bmr = 10 * weight + 6.25 * 160 - 5 * age - 161
    } else {
        bmr = 10 * weight + 6.25 * 170 - 5 * age + 5
    }

    // Activity multiplier (assuming moderate activity 1.375)
    let calories = Math.round(bmr * 1.375)

    // Adjust for goals
    if (data.goal === 'lose_weight') {
        calories -= 500
    } else if (data.goal === 'gain_weight') {
        calories += 500
    } else if (data.goal === 'fitness') {
        calories += 200
    }

    return Math.max(1200, calories) // Minimum healthy limit
}
