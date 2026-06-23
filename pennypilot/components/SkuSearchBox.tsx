'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface SkuSearchBoxProps {
  initialQuery?: string
  placeholder?: string
  autoFocus?: boolean
}

export default function SkuSearchBox({ initialQuery = '', placeholder = 'SKU or model number…', autoFocus }: SkuSearchBoxProps) {
  const [query, setQuery] = useState(initialQuery)
  const [, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative">
      <label htmlFor="sku-search" className="sr-only">Search by SKU or model number</label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
      <input
        id="sku-search"
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="input pl-11 pr-4 py-3.5 text-base"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </form>
  )
}
