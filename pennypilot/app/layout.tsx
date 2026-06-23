import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Fraunces } from 'next/font/google'
import { IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['WONK'],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PennyPilot',
  description: "Community-verified penny item finder for Home Depot, Lowe's, Menards and more.",
  applicationName: 'PennyPilot',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#B66E41',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen bg-paper text-ink">
        <main className="pb-20">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
