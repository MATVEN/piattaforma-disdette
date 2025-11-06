// src/app/new-disdetta/layout.tsx

import ProfileRequired from '@/components/ProfileRequired'
import { ReactNode } from 'react'

// Questo layout avvolge tutte le pagine dentro /new-disdetta
export default function NewDisdettaLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileRequired>
      {children} {/* Mostra la pagina (es. page.tsx) solo se il profilo è completo */}
    </ProfileRequired>
  )
}