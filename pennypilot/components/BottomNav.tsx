'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, TrendingUp, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',          label: 'Feed',     Icon: Home,       isSubmit: false },
  { href: '/search',    label: 'Search',   Icon: Search,     isSubmit: false },
  { href: '/submit',    label: 'Submit',   Icon: PlusCircle, isSubmit: true  },
  { href: '/watchlist', label: 'Watchlist',Icon: TrendingUp, isSubmit: false },
  { href: '/profile',   label: 'Profile',  Icon: User,       isSubmit: false },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/98 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ href, label, Icon, isSubmit }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))

          if (isSubmit) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold"
                aria-current={active ? 'page' : undefined}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-penny transition-all duration-150
                    ${active
                      ? 'scale-95 bg-penny-dark shadow-sm'
                      : 'bg-penny shadow-sm hover:scale-105 active:scale-95'}`}
                >
                  <Icon className="h-5 w-5 text-white" aria-hidden />
                </div>
                <span className={active ? 'text-penny' : 'text-penny/70'}>{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-penny"
                  aria-hidden
                />
              )}
              <Icon
                className={`h-5 w-5 transition-all duration-150 ${active ? 'scale-110 text-penny' : 'text-ink-faint'}`}
                aria-hidden
              />
              <span className={active ? 'font-semibold text-penny' : 'text-ink-faint'}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
