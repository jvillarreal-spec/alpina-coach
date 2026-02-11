/**
 * Basic profanity check for common Spanish offensive words.
 * This is a simple implementation and can be expanded.
 */
const BANNED_WORDS = [
    'puto', 'puta', 'mierda', 'carajo', 'pendejo', 'pendeja',
    'maricon', 'culero', 'culera', 'chingar', 'chingado', 'chingada',
    'perra', 'perro', 'bastardo', 'maldito', 'maldita', 'estupido', 'estupida',
    'zorra', 'hp', 'hpta', 'gonorrea', 'malparido', 'malparida'
]

export function containsProfanity(text: string): boolean {
    if (!text) return false

    const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const words = normalizedText.split(/\s+/)

    return words.some(word =>
        BANNED_WORDS.some(banned =>
            word.includes(banned) || banned.includes(word) && word.length > 3
        )
    )
}
