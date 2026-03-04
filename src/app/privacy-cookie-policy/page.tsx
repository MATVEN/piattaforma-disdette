'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Calendar, FileText, Cookie } from 'lucide-react'

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState<'privacy' | 'cookie'>('privacy')
  const [showStickyNav, setShowStickyNav] = useState(false) // ✅ Nuovo state

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 175 // ✅ Aumentato da 120 a 140 (navbar + sticky pills + gap)
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Track scroll position and active section
  useEffect(() => {
    const handleScroll = () => {
      // ✅ Show sticky nav after scrolling past hero (300px)
      setShowStickyNav(window.scrollY > 180)

      // Track active section
      const privacySection = document.getElementById('privacy-policy')
      const cookieSection = document.getElementById('cookie-policy')
      
      if (privacySection && cookieSection) {
        const privacyTop = privacySection.getBoundingClientRect().top
        const cookieTop = cookieSection.getBoundingClientRect().top
        
        if (cookieTop <= 200) {
          setActiveSection('cookie')
        } else {
          setActiveSection('privacy')
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50">
      {/* Hero */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1
              className="text-4xl sm:text-5xl font-bold inline-block py-2"
              style={{
                backgroundImage: 'linear-gradient(135deg, #00C4B4 0%, #0D417D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Privacy & Cookie Policy
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
              <Calendar className="h-4 w-4" />
              <p>Ultimo aggiornamento: [DA COMPILARE: GG/MM/2025]</p>
            </div>

            {/* DUAL CTA BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
              <button
                onClick={() => scrollToSection('privacy-policy')}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all group"
              >
                <FileText className="h-6 w-6 text-primary-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-sm sm:text-base font-bold text-gray-900">Privacy Policy</div>
                  <div className="text-xs sm:text-sm text-gray-600">Come trattiamo i tuoi dati</div>
                </div>
              </button>

              <button
                onClick={() => scrollToSection('cookie-policy')}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-secondary-200 rounded-xl hover:border-secondary-500 hover:shadow-lg transition-all group"
              >
                <Cookie className="h-6 w-6 text-secondary-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-sm sm:text-base font-bold text-gray-900">Cookie Policy</div>
                  <div className="text-xs sm:text-sm text-gray-600">Gestione cookie e tracking</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ✅ STICKY NAVIGATION PILLS - Show only when scrolled */}
      <AnimatePresence>
      {showStickyNav && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3 py-4 px-2 overflow-x-auto">
              <button
                onClick={() => scrollToSection('privacy-policy')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeSection === 'privacy'
                    ? 'bg-gradient-primary text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <FileText className="h-4 w-4" />
                Privacy Policy
              </button>

              <button
                onClick={() => scrollToSection('cookie-policy')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeSection === 'cookie'
                    ? 'bg-gradient-primary text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <Cookie className="h-4 w-4" />
                Cookie Policy
              </button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 md:p-8 shadow-lg"
        >
          <div className="prose prose-lg max-w-none">
            {/* ========================================
                PRIVACY POLICY
            ======================================== */}
            <div id="privacy-policy" className="scroll-mt-32">
              <h1 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-primary-200">
                📋 Privacy Policy
              </h1>

              {/* Section 1 - Titolare */}
              <section id="titolare" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">1. Titolare del trattamento</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Il Titolare del trattamento è:
                </p>
                <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
                  <p className="text-gray-800 mb-2"><strong>[DA COMPILARE: NOME SOCIETÀ]</strong></p>
                  <p className="text-sm sm:text-base text-gray-700 mb-1">Sede legale: <strong>[DA COMPILARE: SEDE LEGALE]</strong></p>
                  <p className="text-sm sm:text-base text-gray-700 mb-1">P.IVA: <strong>[DA COMPILARE: P.IVA]</strong></p>
                  <p className="text-sm sm:text-base text-gray-700 mb-1">Email: <strong>[DA COMPILARE: Email]</strong></p>
                  <p className="text-sm sm:text-base text-gray-700">PEC: <strong>[DA COMPILARE: PEC]</strong></p>
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-4">
                  Il Titolare gestisce la piattaforma denominata <strong>DisdEasy</strong> ("Piattaforma" o "Servizio").
                </p>
              </section>

              {/* Section 2 - Tipologie dati */}
              <section id="dati-trattati" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">2. Tipologie di dati trattati</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  La Piattaforma tratta le seguenti categorie di dati:
                </p>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">2.1 Dati forniti volontariamente dall'Utente</h3>
                <ul className="list-disc list-inside space-y-2 mb-6">
                  <li className="text-sm sm:text-base text-gray-700">nome, cognome;</li>
                  <li className="text-sm sm:text-base text-gray-700">indirizzo email e/o PEC;</li>
                  <li className="text-sm sm:text-base text-gray-700">codice fiscale;</li>
                  <li className="text-sm sm:text-base text-gray-700">indirizzo di residenza;</li>
                  <li className="text-sm sm:text-base text-gray-700">dati relativi al contratto da disdire/recedere/diffidare;</li>
                  <li className="text-sm sm:text-base text-gray-700">documento di identità (fronte/retro).</li>
                </ul>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">2.2 Dati trattati automaticamente</h3>
                <ul className="list-disc list-inside space-y-2 mb-6">
                  <li className="text-sm sm:text-base text-gray-700">indirizzo IP;</li>
                  <li className="text-sm sm:text-base text-gray-700">user agent, tipo dispositivo, browser;</li>
                  <li className="text-sm sm:text-base text-gray-700">log di accesso, timestamp e tracciati di caricamento documenti;</li>
                  <li className="text-sm sm:text-base text-gray-700">cookie tecnici e, solo previo consenso, cookie di analytics o marketing.</li>
                </ul>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">2.3 Dati relativi all'uso del servizio</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li className="text-sm sm:text-base text-gray-700">documenti generati (disdette, diffide, reclami);</li>
                  <li className="text-sm sm:text-base text-gray-700">ricevute PEC inviate e ricevute;</li>
                  <li className="text-sm sm:text-base text-gray-700">metadati (ID messaggi, consegna, accettazione).</li>
                </ul>
              </section>

              {/* Section 3 - Finalità */}
              <section id="finalita" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">3. Finalità del trattamento e basi giuridiche</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Finalità</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Base giuridica</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Conservazione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">A) Generazione e invio comunicazioni (PEC, raccomandata digitale ecc.)</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Art. 6.1.b GDPR - esecuzione contratto</td>
                        <td className="px-4 py-3 text-sm text-gray-700">10 anni</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">B) Identificazione dell'Utente tramite documento d'identità</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Art. 6.1.a GDPR - consenso</td>
                        <td className="px-4 py-3 text-sm text-gray-700">10 anni</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">C) Conservazione ricevute PEC per finalità probatorie</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Interesse legittimo (art. 6.1.f) + obblighi normativi</td>
                        <td className="px-4 py-3 text-sm text-gray-700">10 anni</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">D) Assistenza al Cliente</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Interesse legittimo</td>
                        <td className="px-4 py-3 text-sm text-gray-700">36 mesi</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">E) Prevenzione uso illecito/frode</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Interesse legittimo</td>
                        <td className="px-4 py-3 text-sm text-gray-700">10 anni</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">F) Adempimenti fiscali e contabili</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Obbligo legale (art. 6.1.c)</td>
                        <td className="px-4 py-3 text-sm text-gray-700">10 anni</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">G) Marketing (newsletter, offerte)</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Consenso espresso</td>
                        <td className="px-4 py-3 text-sm text-gray-700">fino a revoca</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 4 - Modalità */}
              <section id="modalita" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">4. Modalità di trattamento</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  I dati sono trattati mediante:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">strumenti elettronici;</li>
                  <li className="text-sm sm:text-base text-gray-700">protocolli crittografati;</li>
                  <li className="text-sm sm:text-base text-gray-700">sistemi certificati PEC e cloud UE;</li>
                  <li className="text-sm sm:text-base text-gray-700">misure tecniche e organizzative idonee ex art. 32 GDPR.</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Nessuna decisione automatizzata produce effetti giuridici sull'Utente (art. 22 GDPR).
                </p>
              </section>

              {/* Section 5 - Conservazione */}
              <section id="conservazione" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">5. Conservazione dei dati</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Il documento d'identità e la delega sono conservati per <strong>10 anni</strong> per:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">tutela giudiziaria del Titolare;</li>
                  <li className="text-sm sm:text-base text-gray-700">tracciabilità del mandato;</li>
                  <li className="text-sm sm:text-base text-gray-700">prevenzione frodi.</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Le ricevute PEC sono conservate per <strong>10 anni</strong> per obbligo normativo.
                </p>
              </section>

              {/* Section 6 - Destinatari */}
              <section id="destinatari" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">6. Destinatari dei dati</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  I dati possono essere comunicati a:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">provider PEC e servizi di raccomandata digitale;</li>
                  <li className="text-sm sm:text-base text-gray-700">fornitori cloud con server in UE;</li>
                  <li className="text-sm sm:text-base text-gray-700">eventuali consulenti (commercialisti, avvocati, tecnici IT) nominati Responsabili esterni;</li>
                  <li className="text-sm sm:text-base text-gray-700">autorità giudiziaria, solo se richiesto.</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-gray-800 font-medium">
                    ⚠️ I dati NON sono venduti, diffusi o comunicati a terzi per finalità commerciali.
                  </p>
                </div>
              </section>

              {/* Section 7 - Trasferimento extra-UE */}
              <section id="trasferimento" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">7. Trasferimento extra-UE</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Eventuali strumenti esterni (es. AI o cloud) possono comportare un trasferimento extra-UE.
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Il Titolare applica le Clausole Contrattuali Standard (SCC) e adotta misure integrative idonee 
                  (encryption, access control) conformi alle linee guida EDPB.
                </p>
              </section>

              {/* Section 8 - Diritti */}
              <section id="diritti" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">8. Diritti dell'Utente (artt. 15-22 GDPR)</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  L'Utente può esercitare i seguenti diritti scrivendo al Titolare:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">accesso ai dati;</li>
                  <li className="text-sm sm:text-base text-gray-700">rettifica;</li>
                  <li className="text-sm sm:text-base text-gray-700">cancellazione ("diritto all'oblio");</li>
                  <li className="text-sm sm:text-base text-gray-700">limitazione;</li>
                  <li className="text-sm sm:text-base text-gray-700">portabilità;</li>
                  <li className="text-sm sm:text-base text-gray-700">opposizione;</li>
                  <li className="text-sm sm:text-base text-gray-700">revoca del consenso.</li>
                </ul>
                <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
                  <h3 className="font-bold text-gray-900 mb-2">Reclamo al Garante</h3>
                  <p className="text-sm sm:text-base text-gray-700">
                    L'Utente può proporre reclamo a:{' '}
                    <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      www.garanteprivacy.it
                    </a>
                  </p>
                </div>
              </section>

              {/* Section 9 - Natura conferimento */}
              <section id="conferimento" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">9. Natura del conferimento dei dati</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li className="text-sm sm:text-base text-gray-700">
                    Il conferimento dei dati per finalità <strong>A), B), C), F)</strong> è <strong>obbligatorio</strong> e 
                    necessario per utilizzare la Piattaforma.
                  </li>
                  <li className="text-sm sm:text-base text-gray-700">
                    Il conferimento per finalità <strong>G)</strong> è <strong>facoltativo</strong>.
                  </li>
                </ul>
              </section>

              {/* Section 10 - Sicurezza */}
              <section id="sicurezza" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">10. Sicurezza</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Il Titolare adotta misure adeguate:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li className="text-sm sm:text-base text-gray-700">cifratura dei documenti caricati;</li>
                  <li className="text-sm sm:text-base text-gray-700">accesso protetto ai file;</li>
                  <li className="text-sm sm:text-base text-gray-700">registri di trattamento;</li>
                  <li className="text-sm sm:text-base text-gray-700">firewall e sistemi anti-intrusione;</li>
                  <li className="text-sm sm:text-base text-gray-700">conservazione su server certificati ISO 27001.</li>
                </ul>
              </section>

              {/* Section 11 - Profilazione */}
              <section id="profilazione" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">11. Profilazione e IA</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  La Piattaforma utilizza sistemi di automazione per compilare i moduli e generare documenti.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-gray-800 font-medium">
                    ⚠️ Non vi è profilazione né decisione automatizzata con effetti giuridici.
                  </p>
                </div>
              </section>

              {/* Section 12 - Minori */}
              <section id="minori" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">12. Minori</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Il servizio è riservato a utenti <strong>maggiorenni</strong>.
                </p>
              </section>

              {/* Section 13 - Modifiche */}
              <section id="modifiche-privacy" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">13. Modifiche all'informativa</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Il Titolare può modificare la presente Informativa.
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Le modifiche saranno pubblicate sul sito o comunicate via email agli Utenti.
                </p>
              </section>
            </div>

            {/* ========================================
                COOKIE POLICY
            ======================================== */}
            <div id="cookie-policy" className="scroll-mt-36 border-t-2 border-gray-200 pt-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-primary-200">
                🍪 Cookie Policy
              </h1>

              {/* Section 1 - Titolare Cookie */}
              <section id="cookie-titolare" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">1. Titolare del trattamento</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Il presente sito è gestito da:
                </p>
                <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
                  <p className="text-gray-800 mb-2"><strong>[DA COMPILARE: NOME SOCIETÀ]</strong></p>
                  <p className="text-sm sm:text-base text-gray-700 mb-1">Sede legale: <strong>[DA COMPILARE: SEDE LEGALE]</strong></p>
                  <p className="text-sm sm:text-base text-gray-700 mb-1">P.IVA: <strong>[DA COMPILARE: P.IVA]</strong></p>
                  <p className="text-sm sm:text-base text-gray-700 mb-1">Email: <strong>[DA COMPILARE: Email]</strong></p>
                  <p className="text-sm sm:text-base text-gray-700">PEC: <strong>[DA COMPILARE: PEC]</strong></p>
                </div>
              </section>

              {/* Section 2 - Cosa sono */}
              <section id="cosa-sono" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">2. Cosa sono i Cookie</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  I cookie sono stringhe di testo che il sito invia al dispositivo dell'Utente (PC, smartphone, tablet) 
                  per migliorare l'esperienza di navigazione o per fornire informazioni statistiche.
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Sono distinti in:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">Cookie tecnici o necessari</li>
                  <li className="text-sm sm:text-base text-gray-700">Cookie di analisi (analytics)</li>
                  <li className="text-sm sm:text-base text-gray-700">Cookie di profilazione/marketing</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  La normativa di riferimento è il GDPR, il Codice Privacy (D.lgs. 196/2003) e la Direttiva ePrivacy.
                </p>
              </section>

              {/* Section 3 - Cookie tecnici */}
              <section id="cookie-tecnici" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">3. Cookie tecnici (sempre attivi - non richiedono consenso)</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  DisdEasy utilizza cookie tecnici necessari per:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">il corretto funzionamento del sito;</li>
                  <li className="text-sm sm:text-base text-gray-700">la gestione della sessione;</li>
                  <li className="text-sm sm:text-base text-gray-700">l'erogazione del servizio richiesto dall'Utente;</li>
                  <li className="text-sm sm:text-base text-gray-700">la sicurezza della piattaforma;</li>
                  <li className="text-sm sm:text-base text-gray-700">il salvataggio delle preferenze di lingua o layout.</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Questi cookie non memorizzano informazioni personali e non possono essere disattivati tramite banner.
                </p>
              </section>

              {/* Section 4 - Analytics */}
              <section id="cookie-analytics" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">4. Cookie di analisi (analytics)</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  DisdEasy può utilizzare, previo consenso:
                </p>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">4.1 Analytics anonimizzati</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Consentiti senza consenso, purché:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-6">
                  <li className="text-sm sm:text-base text-gray-700">anonimizzino l'indirizzo IP;</li>
                  <li className="text-sm sm:text-base text-gray-700">non permettano identificazione dell'utente;</li>
                  <li className="text-sm sm:text-base text-gray-700">siano utilizzati solo per statistiche aggregate.</li>
                </ul>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">4.2 Analytics non anonimizzati</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Richiedono il consenso esplicito tramite banner.
                </p>
              </section>

              {/* Section 5 - Profilazione */}
              <section id="cookie-profilazione" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">5. Cookie di profilazione e marketing</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Sono cookie utilizzati per:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">inviare pubblicità personalizzata;</li>
                  <li className="text-sm sm:text-base text-gray-700">tracciare la navigazione su più siti;</li>
                  <li className="text-sm sm:text-base text-gray-700">misurare prestazioni delle campagne pubblicitarie;</li>
                  <li className="text-sm sm:text-base text-gray-700">attività di remarketing (es. tramite Meta/Google).</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Questi cookie possono essere installati <strong>solo previo consenso esplicito</strong> dell'Utente.
                </p>
              </section>

              {/* Section 6 - Terze parti */}
              <section id="cookie-terze-parti" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">6. Cookie di terze parti</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Sono installati da servizi esterni al sito, tra cui:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">Google LLC (Google Analytics, Google Ads, Tag Manager)</li>
                  <li className="text-sm sm:text-base text-gray-700">Meta Platforms (Meta Pixel)</li>
                  <li className="text-sm sm:text-base text-gray-700">Strumenti di invio PEC o tracciamento email</li>
                  <li className="text-sm sm:text-base text-gray-700">Provider cloud o CDN</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Le terze parti possono utilizzare i cookie per finalità proprie. Si rinvia alle relative Privacy Policy.
                </p>
              </section>

              {/* Section 7 - Banner */}
              <section id="banner" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">7. Banner Cookie - Obblighi del sito</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Al primo accesso, il sito deve mostrare un banner conforme, che consente di:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">Accettare tutti i cookie</li>
                  <li className="text-sm sm:text-base text-gray-700">Rifiutare tutti i cookie non necessari</li>
                  <li className="text-sm sm:text-base text-gray-700">Gestire le preferenze</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Il banner deve:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li className="text-sm sm:text-base text-gray-700">bloccare preventivamente tutti i cookie non tecnici;</li>
                  <li className="text-sm sm:text-base text-gray-700">salvare e rispettare la scelta dell'utente;</li>
                  <li className="text-sm sm:text-base text-gray-700">permettere di modificare le preferenze in ogni momento (es. "Rivedi preferenze cookie").</li>
                </ul>
              </section>

              {/* Section 8 - Consensi */}
              <section id="consensi" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">8. Conservazione dei consensi (Cookie Consent Log)</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  DisdEasy conserva:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">data/ora del consenso;</li>
                  <li className="text-sm sm:text-base text-gray-700">preferenze selezionate;</li>
                  <li className="text-sm sm:text-base text-gray-700">ID cookie policy;</li>
                  <li className="text-sm sm:text-base text-gray-700">eventuali modifiche successive.</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  La conservazione avviene per <strong>24 mesi</strong>, come da linee guida Garante.
                </p>
              </section>

              {/* Section 9 - Browser */}
              <section id="gestione-browser" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">9. Gestione Cookie tramite browser</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  L'Utente può disabilitare o cancellare i cookie attraverso le impostazioni del proprio browser:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">Chrome</li>
                  <li className="text-sm sm:text-base text-gray-700">Safari</li>
                  <li className="text-sm sm:text-base text-gray-700">Firefox</li>
                  <li className="text-sm sm:text-base text-gray-700">Edge</li>
                  <li className="text-sm sm:text-base text-gray-700">Opera</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-gray-800 font-medium">
                    ⚠️ La disattivazione potrebbe compromettere il funzionamento del sito.
                  </p>
                </div>
              </section>

              {/* Section 10 - Extra-UE Cookie */}
              <section id="trasferimento-cookie" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">10. Trasferimento dati extra-UE</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Alcuni servizi di terze parti potrebbero implicare un trasferimento dei dati fuori dall'UE (es. Google, Meta).
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  In tali casi, il Titolare adotta:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li className="text-sm sm:text-base text-gray-700">Clausole Contrattuali Standard (SCC);</li>
                  <li className="text-sm sm:text-base text-gray-700">misure tecniche supplementari (es. cifratura, minimizzazione);</li>
                  <li className="text-sm sm:text-base text-gray-700">verifiche di adeguatezza ai sensi dell'art. 46 GDPR.</li>
                </ul>
              </section>

              {/* Section 11 - Diritti Cookie */}
              <section id="diritti-cookie" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">11. Diritti dell'Utente</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  L'Utente può esercitare in ogni momento i diritti previsti dal GDPR:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li className="text-sm sm:text-base text-gray-700">accesso;</li>
                  <li className="text-sm sm:text-base text-gray-700">rettifica;</li>
                  <li className="text-sm sm:text-base text-gray-700">cancellazione;</li>
                  <li className="text-sm sm:text-base text-gray-700">limitazione;</li>
                  <li className="text-sm sm:text-base text-gray-700">opposizione;</li>
                  <li className="text-sm sm:text-base text-gray-700">portabilità;</li>
                  <li className="text-sm sm:text-base text-gray-700">revoca del consenso.</li>
                </ul>
                <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
                  <p className="text-sm sm:text-base text-gray-700 mb-2">
                    <strong>Richieste:</strong> [DA COMPILARE: Email Titolare]
                  </p>
                  <p className="text-sm sm:text-base text-gray-700">
                    <strong>Reclamo:</strong>{' '}
                    <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      www.garanteprivacy.it
                    </a>
                  </p>
                </div>
              </section>

              {/* Section 12 - Modifiche Cookie */}
              <section id="modifiche-cookie" className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">12. Modifiche alla Cookie Policy</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Il Titolare può modificare la presente informativa.
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Le modifiche saranno pubblicate sul sito e, ove necessario, comunicate agli Utenti.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}