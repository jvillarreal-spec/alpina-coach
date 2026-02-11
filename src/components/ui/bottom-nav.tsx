'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, BarChart2, User } from 'lucide-react'

export function BottomNav() {
    const pathname = usePathname()

    const tabs = [
        { name: 'Chat', href: '/chat', icon: MessageCircle },
        { name: 'Mi día', href: '/summary', icon: BarChart2 },
        { name: 'Mi perfil', href: '/profile', icon: User },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-white px-6 pb-2">
            <div className="mx-auto flex w-full max-w-md justify-around items-center">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#1B3A5C]' : 'text-gray-400'}`}
                        >
                            <tab.icon size={24} className={isActive ? 'fill-current' : ''} />
                            <span className="text-xs font-medium">{tab.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
