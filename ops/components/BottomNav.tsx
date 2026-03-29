'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Semana', icon: '📆' },
  { href: '/stats', label: 'Analíticas', icon: '📊' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#e5e7eb] bg-white flex justify-around px-4 py-3 z-50 shadow-lg shadow-black/5">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
              isActive
                ? 'text-[#f97316] scale-110'
                : 'text-[#9ca3af] hover:text-[#6b7280]'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
