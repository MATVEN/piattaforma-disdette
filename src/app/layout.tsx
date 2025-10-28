// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
// 1. Importa il Navbar
import Navbar from '@/components/Navbar'

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
          {/* 2. Aggiungi il Navbar qui */}
          <Navbar />
          {/* 'children' ora sono le nostre pagine (login, register, home...) */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}