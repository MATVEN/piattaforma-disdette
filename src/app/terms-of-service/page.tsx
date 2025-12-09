// src/app/terms-of-service/page.tsx
// Terms of Service - Placeholder content (C19)

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">Termini di Servizio</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
          Termini di Servizio
        </h1>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-card p-8 sm:p-12">
          <div className="prose prose-indigo max-w-none">
            <p className="text-gray-600 italic mb-8">
              Documento in fase di redazione legale.
            </p>

            <p className="text-gray-600 leading-relaxed mb-6">
              Questa sezione definirà:
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Oggetto del Servizio
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [Descrizione servizio]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. Registrazione e Account
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [Requisiti e obblighi utente]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. Utilizzo del Servizio
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [Termini d&apos;uso]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              4. Responsabilità
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [Limitazioni e esclusioni]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              5. Proprietà Intellettuale
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [Copyright e licenze]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              6. Modifiche ai Termini
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [Procedura di aggiornamento]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              7. Legge Applicabile
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Legge italiana - Foro competente: [Da definire]
            </p>

            <hr className="my-8 border-gray-200" />

            <p className="text-gray-500 text-sm italic">
              Ultimo aggiornamento: [Data da definire]
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
