'use client'

import { useState, useEffect } from 'react'
import { Metadata } from 'next'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, FileCheck, AlertCircle, CheckCircle, Info, Zap, Scale } from 'lucide-react'

export default function TutelaConsumatorePage() {
  const [activeSection, setActiveSection] = useState<string>('cose-disdeasy')
  const [showStickyNav, setShowStickyNav] = useState(false)

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 140
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
      // Show sticky nav when CTA buttons are no longer visible
      const heroSection = document.querySelector('.hero-cta-buttons')
      if (heroSection) {
        const rect = heroSection.getBoundingClientRect()
        setShowStickyNav(rect.bottom < 0)
      }

      const sections = ['cose-disdeasy', 'valore-pec', 'dopo-disdetta', 'non-risponde', 'responsabilita']
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50">
      {/* Hero Section */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4"
              style={{
                backgroundImage: 'linear-gradient(135deg, #00C4B4 0%, #0D417D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Tutela del Consumatore
            </h1>
            <p className="text-xl text-gray-600">
              Tutto quello che devi sapere sulla valenza legale della tua disdetta e come tutelarti
            </p>
          </motion.div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pt-0 pb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* 5 CTA Buttons */}
            <div className="hero-cta-buttons flex flex-wrap justify-center items-stretch gap-2">
 
              <button
                onClick={() => scrollToSection('cose-disdeasy')}
                className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all group"
              >
                <Info className="h-5 w-5 text-primary-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Cos'è DisdEasy</div>
                  <div className="text-xs text-gray-600">Natura del servizio</div>
                </div>
              </button>

              <button
                onClick={() => scrollToSection('valore-pec')}
                className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all group"
              >
                <FileCheck className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Valore PEC</div>
                  <div className="text-xs text-gray-600">Prova legale</div>
                </div>
              </button>

              <button
                onClick={() => scrollToSection('dopo-disdetta')}
                className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all group"
              >
                <Zap className="h-5 w-5 text-yellow-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Dopo Disdetta</div>
                  <div className="text-xs text-gray-600">Luce e gas</div>
                </div>
              </button>

              <button
                onClick={() => scrollToSection('non-risponde')}
                className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all group"
              >
                <AlertCircle className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Non Risponde</div>
                  <div className="text-xs text-gray-600">Come tutelarti</div>
                </div>
              </button>

              <button
                onClick={() => scrollToSection('responsabilita')}
                className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all group"
              >
                <Scale className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Responsabilità</div>
                  <div className="text-xs text-gray-600">Limiti servizio</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sticky Navigation Pills */}
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
              <div className="flex justify-center items-center gap-2 py-3 overflow-x-auto">
                <button
                  onClick={() => scrollToSection('cose-disdeasy')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                    activeSection === 'cose-disdeasy'
                      ? 'bg-gradient-primary text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <Info className="h-4 w-4" />
                  Cos'è DisdEasy
                </button>

                <button
                  onClick={() => scrollToSection('valore-pec')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                    activeSection === 'valore-pec'
                      ? 'bg-gradient-primary text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <FileCheck className="h-4 w-4" />
                  Valore PEC
                </button>

                <button
                  onClick={() => scrollToSection('dopo-disdetta')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                    activeSection === 'dopo-disdetta'
                      ? 'bg-gradient-primary text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Dopo Disdetta
                </button>

                <button
                  onClick={() => scrollToSection('non-risponde')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                    activeSection === 'non-risponde'
                      ? 'bg-gradient-primary text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  Non Risponde
                </button>

                <button
                  onClick={() => scrollToSection('responsabilita')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                    activeSection === 'responsabilita'
                      ? 'bg-gradient-primary text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <Scale className="h-4 w-4" />
                  Responsabilità
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - UNICO BOX BIANCO */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 md:p-12 shadow-lg"
        >
          <div className="prose prose-lg max-w-none">

            {/* ========================================
                SEZIONE 1: COS'È DISDEASY
            ======================================== */}
            <section id="cose-disdeasy" className="scroll-mt-32">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-primary-200 flex items-center gap-3">
                <Info className="w-7 h-7 text-primary-600" />
                Cos&apos;è DisdEasy
              </h1>

              <p className="text-gray-600 leading-relaxed">
                DisdEasy è un servizio digitale che ti permette di predisporre e trasmettere una comunicazione formale di disdetta o recesso per contratti di fornitura (energia elettrica, gas, telefonia, internet, pay-TV e servizi analoghi).
              </p>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Il servizio include:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Acquisizione dei tuoi dati e documenti</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Generazione automatica del documento di disdetta in PDF</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Trasmissione tramite Posta Elettronica Certificata (PEC)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Messa a disposizione delle ricevute PEC</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-900">
                  <strong>Nota:</strong> DisdEasy non fornisce consulenza legale personalizzata, non effettua valutazioni sul tuo contratto e non assume alcun incarico di assistenza legale. Il servizio si esaurisce con l&apos;invio della comunicazione tramite PEC.
                </p>
              </div>
            </section>

            {/* ========================================
                SEZIONE 2: VALORE LEGALE PEC
            ======================================== */}
            <section id="valore-pec" className="scroll-mt-32 mt-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-primary-200 flex items-center gap-3">
                <FileCheck className="w-7 h-7 text-green-600" />
                Valore Legale della PEC
              </h1>

              <p className="text-gray-600 leading-relaxed mb-6">
                La Posta Elettronica Certificata (PEC), ai sensi del D.P.R. 68/2005 e del D.lgs. 82/2005 (Codice dell&apos;Amministrazione Digitale), costituisce mezzo idoneo a fornire prova legale dell&apos;invio e della consegna di una comunicazione.
              </p>

              <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-4">Ricevute generate:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">&bull;</span>
                    <span className="text-gray-700"><strong>Ricevuta di accettazione:</strong> conferma che il messaggio è stato inviato</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">&bull;</span>
                    <span className="text-gray-700"><strong>Ricevuta di avvenuta consegna:</strong> attesta data e ora di consegna alla casella PEC del destinatario</span>
                  </li>
                </ul>
              </div>

              <p className="text-gray-600 leading-relaxed">
                DisdEasy ti rende disponibili queste ricevute come prova dell&apos;avvenuta trasmissione. La validità e gli effetti della disdetta restano disciplinati dal contratto che hai sottoscritto e dalla normativa applicabile al settore.
              </p>
            </section>

            {/* ========================================
                SEZIONE 3: COSA SUCCEDE DOPO (LUCE/GAS)
            ======================================== */}
            <section id="dopo-disdetta" className="scroll-mt-32 mt-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-primary-200 flex items-center gap-3">
                <Zap className="w-7 h-7 text-yellow-600" />
                Cosa Succede Dopo la Disdetta di Luce o Gas?
              </h1>

              <p className="text-gray-600 leading-relaxed mb-6">
                La disdetta del contratto di fornitura non comporta automaticamente l&apos;interruzione del servizio. Gli effetti dipendono dalla tua situazione:
              </p>

              <div className="space-y-4 mb-6">
                {/* Scenario 1 */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Se attivi un nuovo fornitore
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    La fornitura prosegue senza interruzioni. Il nuovo gestore subentra nel punto di fornitura e il contratto precedente viene chiuso automaticamente.
                  </p>
                </div>

                {/* Scenario 2 */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Se non indichi un nuovo fornitore
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Il punto di fornitura può essere assegnato automaticamente a un fornitore di ultima istanza o a un regime transitorio previsto dalla normativa vigente. La fornitura continua, ma le condizioni economiche possono risultare diverse rispetto al contratto precedente.
                  </p>
                </div>

                {/* Scenario 3 */}
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-red-600" />
                    Se richiedi la cessazione del punto
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Il contatore viene disattivato e la fornitura interrotta. Un eventuale nuovo occupante dovrà attivare un nuovo contratto.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900">
                  <strong>Normativa:</strong> Le modalità e le condizioni sono disciplinate dalla normativa di settore e dalle delibere dell&apos;Autorità competente (ARERA). DisdEasy non interviene nella gestione tecnica della fornitura né nelle condizioni economiche applicate successivamente.
                </p>
              </div>
            </section>

            {/* ========================================
                SEZIONE 4: SE IL FORNITORE NON RISPONDE
            ======================================== */}
            <section id="non-risponde" className="scroll-mt-32 mt-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-primary-200 flex items-center gap-3">
                <AlertCircle className="w-7 h-7 text-red-600" />
                Se il Fornitore Non Risponde
              </h1>

              <p className="text-gray-600 leading-relaxed">
                L&apos;eventuale mancata risposta del fornitore non incide sulla prova dell&apos;avvenuta trasmissione della comunicazione, purché risulti generata la ricevuta di avvenuta consegna PEC.
              </p>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Cosa puoi fare:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">1</span>
                    <p className="text-gray-700">Utilizzare la documentazione (disdetta e ricevute PEC) per inviare un sollecito</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">2</span>
                    <p className="text-gray-700">Attivare le procedure di reclamo o conciliazione previste dal settore di riferimento</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">3</span>
                    <p className="text-gray-700">Rivolgerti a un avvocato o professionista di fiducia per assistenza legale</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-900">
                  <strong>Importante:</strong> DisdEasy non svolge attività di recupero crediti, gestione reclami o assistenza legale successiva all&apos;invio della disdetta.
                </p>
              </div>
            </section>

            {/* ========================================
                SEZIONE 5: RESPONSABILITÀ E LIMITI
            ======================================== */}
            <section id="responsabilita" className="scroll-mt-32 mt-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-primary-200 flex items-center gap-3">
                <Scale className="w-7 h-7 text-indigo-600" />
                Responsabilità e Limiti del Servizio
              </h1>

              <div className="space-y-6">
                {/* Responsabilità Utente */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">La tua responsabilità</h3>
                  <p className="text-gray-600 leading-relaxed mb-2">
                    Dichiari sotto la tua responsabilità di essere l&apos;intestatario del contratto oggetto di disdetta o di essere legittimato ad agire, che i dati e documenti caricati sono veritieri e corretti e che la richiesta corrisponde alla tua effettiva volontà.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Eventuali dichiarazioni non veritiere restano di tua esclusiva responsabilità.
                  </p>
                </div>

                {/* Limiti */}
                <div className="bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Limiti del servizio</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <span className="text-gray-400">&bull;</span>
                      <span className="text-gray-700">DisdEasy non è parte del contratto tra te e il fornitore</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-400">&bull;</span>
                      <span className="text-gray-700">Non assume obblighi di risultato in merito alla cessazione del servizio</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-400">&bull;</span>
                      <span className="text-gray-700">Non sostituisce l&apos;assistenza di un legale nei casi di contenzioso</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-400">&bull;</span>
                      <span className="text-gray-700">Il servizio ha natura esclusivamente tecnica e documentale</span>
                    </li>
                  </ul>
                </div>

                {/* Conservazione */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Conservazione della documentazione</h3>
                  <p className="text-sm text-blue-900">
                    La disdetta generata e le ricevute PEC vengono rese disponibili per il download. Ti consigliamo di conservarne copia per eventuali necessità future.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  )
}