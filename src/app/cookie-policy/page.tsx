// src/app/cookie-policy/page.tsx
// Cookie Policy - Placeholder content (C19)

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">Cookie Policy</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
          Cookie Policy
        </h1>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-card p-8 sm:p-12">
          <div className="prose prose-indigo max-w-none">
            <p className="text-gray-600 italic mb-8">
              Documento in fase di redazione.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Cosa sono i Cookie
            </h2>
            <p className="text-gray-600 leading-relaxed">
              [Spiegazione tecnica]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. Cookie Utilizzati
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Cookie Tecnici (necessari)
            </h3>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>Session management</li>
              <li>Authentication</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Cookie Analitici (opzionali)
            </h3>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>Google Analytics (quando implementato)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Cookie di Marketing (opzionali)
            </h3>
            <p className="text-gray-600 leading-relaxed">
              [Da definire]
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. Gestione dei Cookie
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Puoi gestire le preferenze cookie tramite:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>Impostazioni browser</li>
              <li>Banner cookie (in implementazione)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              4. Contatti
            </h2>
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
