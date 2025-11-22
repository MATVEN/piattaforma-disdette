// src/app/privacy-policy/page.tsx
// Privacy Policy - Placeholder content (C19)

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Piattaforma Disdette',
  description: 'Informativa sulla privacy e trattamento dati personali secondo GDPR',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">Privacy Policy</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-card p-8 sm:p-12">
          <div className="prose prose-indigo max-w-none">
            <p className="text-gray-600 italic mb-8">
              Documento in fase di redazione da parte del team legale.
            </p>

            <p className="text-gray-600 leading-relaxed mb-6">
              Questa sezione conterrà informazioni dettagliate su:
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Titolare del Trattamento
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [In fase di definizione]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. Tipologie di Dati Raccolti
            </h2>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>Dati identificativi (nome, cognome, email, telefono)</li>
              <li>Dati di navigazione</li>
              <li>Dati dei documenti caricati</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. Finalità del Trattamento
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [In fase di definizione secondo GDPR Art. 6]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              4. Base Giuridica
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [In fase di definizione]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              5. Diritti degli Utenti
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              In conformità al GDPR, hai diritto a:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>Accesso ai dati</li>
              <li>Rettifica</li>
              <li>Cancellazione (diritto all&apos;oblio)</li>
              <li>Limitazione del trattamento</li>
              <li>Portabilità dei dati</li>
              <li>Opposizione</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              6. Contatti
            </h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              Per esercitare i tuoi diritti o per informazioni:
            </p>
            <p className="text-gray-600 leading-relaxed">
              Email:{' '}
              <a
                href="mailto:privacy@disdette.it"
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                privacy@disdette.it
              </a>
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
