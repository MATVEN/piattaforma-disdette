// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import ToastProvider from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Piattaforma Disdette',
  description: 'Gestisci le tue disdette in modo semplice',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {/* 'children' sono le pagine (login, register, home...) */}
          <main>{children}</main>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  )
}