'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, TrendingUp, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',          label: 'Feed',      Icon: Home },
  { href: '/search',    label: 'Search',    Icon: Search },
  { href: '/submit',    label: 'Submit',    Icon: PlusCircle },
  { href: '/watchlist', label: 'Watchlist', Icon: TrendingUp },
  { href: '/profile',   label: 'Profile',   Icon: User },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/95 backdrop-blur-sm"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors
                ${active ? 'text-penny' : 'text-ink-faint hover:text-ink-muted'}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`}
                aria-hidden
              />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
