import { BottomNav } from '@/components/ui/bottom-nav'

export default function ConsumerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col bg-[#FAFBFC] pb-16">
            <main className="flex-1">{children}</main>
            <BottomNav />
        </div>
    )
}
