export type UserGoal = 'lose_weight' | 'gain_weight' | 'eat_better' | 'fitness'

export interface Profile {
    id: string
    email: string
    display_name?: string
    goal: UserGoal
    current_weight: number
    target_weight?: number
    sex: 'male' | 'female' | 'other'
    age_range: string
    daily_calorie_target: number
    onboarding_completed: boolean
}

export interface FoodAnalysis {
    food_name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    confidence: 'high' | 'medium' | 'low'
    is_colombian: boolean
}

export interface AlpinaRecommendation {
    product_name: string
    reason: string
    calories: number
    protein: number
    carbs: number
    fat: number
}

export interface ChatMessage {
    id: string
    user_id: string
    role: 'user' | 'assistant'
    content: string
    image_url?: string
    metadata?: any
    created_at: string
}

export interface AlpinaProduct {
    name: string
    category: string
    serving_size: string
    calories: number
    protein: number
    carbs: number
    fat: number
    use_cases: string[]
}

export interface ColombianFood {
    name: string
    region: string
    serving_size: string
    calories: number
    protein: number
    carbs: number
    fat: number
}
