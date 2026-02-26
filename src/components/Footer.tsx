// src/components/Footer.tsx
// Footer completo con link legali e social (C19)

import Link from 'next/link'
import Image from 'next/image'
import { Linkedin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Grid - 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1 - Brand */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/images/disdeasy-logo.png"
                alt="DisdEasy"
                width={150}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm mt-2">
              Semplifichiamo le tue disdette
            </p>
          </div>

          {/* Column 2 - Prodotto */}
          <div>
            <h3 className="text-white font-semibold mb-4">Prodotto</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/how-it-works"
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                Come funziona
              </Link>
              <Link
                href="/operators"
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                Operatori
              </Link>
              <Link
                href="/who-we-are"
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                Chi siamo - Mission & Vision
              </Link>
            </nav>
          </div>

          {/* Column 3 - Supporto */}
          <div>
            <h3 className="text-white font-semibold mb-4">Supporto</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/faq"
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                Contatti
              </Link>
              <a
                href="mailto:support@DisdEasy.it?subject=Richiesta%20Supporto&body=Buongiorno,%0A%0Aho%20bisogno%20di%20assistenza%20per..."
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                support@DisdEasy.it
              </a>
            </nav>
          </div>

          {/* Column 4 - Legale */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legale</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/privacy-cookie-policy"
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                Privacy & Cookie Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                Termini di Servizio
              </Link>
              <Link
                href="/consumer-protection"
                className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
              >
                Tutela Consumatore
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Row - Copyright & Social */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-gray-400 text-sm text-center sm:text-left">
              © {currentYear} Piattaforma Disdette. Tutti i diritti riservati.
            </p>

            {/* Social Icons */}
            <div className="flex items-center space-x-4">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}