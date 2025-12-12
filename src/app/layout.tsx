// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { TooltipProvider } from '@/context/TooltipContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ToastProvider from '@/components/ToastProvider'
import { WelcomeModal } from '@/components/onboarding/WelcomeModal'
import { HelpButton } from '@/components/onboarding/HelpButton'

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
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <OnboardingProvider>
            <TooltipProvider>
              <WelcomeModal />
              <HelpButton />
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <ToastProvider />
            </TooltipProvider>
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}