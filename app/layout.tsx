import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SeatMapBuilder',
  description: 'Professional seating design and management tool by Lorenzo Grignola',
  generator: 'v0.app',
  authors: [{ name: 'Lorenzo Grignola', url: 'https://github.com/lologrignola' }],
  keywords: ['seating', 'venue', 'design', 'management', 'seats', 'map'],
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
