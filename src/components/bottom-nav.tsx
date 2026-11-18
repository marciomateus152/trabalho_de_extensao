'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Package, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/pdv', label: 'PDV', icon: ShoppingCart },
  { href: '/estoque', label: 'Estoque', icon: Package },
  { href: '/fiados', label: 'Fiados', icon: Users },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-white border-t-2 border-slate-200 shadow-lg max-w-md mx-auto">
      <div className="grid grid-cols-4 h-full">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform select-none',
                isActive
                  ? 'text-emerald-700 font-bold bg-emerald-50/70 border-t-4 border-emerald-600'
                  : 'text-slate-600 font-medium hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5px]')} />
              <span className="text-xs tracking-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
