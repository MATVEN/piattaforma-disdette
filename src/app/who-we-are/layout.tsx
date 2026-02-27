import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chi Siamo - Mission&Vision | DisdEasy',
  description: 'Scopri la mission di DisdEasy: semplificare la gestione dei contratti. Conosci il team e la nostra filosofia di trasparenza e affidabilità.',
}

export default function ChiSiamoLayout({ children }: { children: React.ReactNode }) {
  return children
}
