'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone,
  Wifi,
  Tv,
  Zap,
  Shield,
  Dumbbell,
  FileEdit,
  Send,
  CheckCircle,
  Scale,
  PiggyBank,
  Clock,
  Headphones,
  Lock,
  Archive,
  ShieldCheck,
  Users,
  Star,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'

const categories = [
  { id: 'mobile', name: 'Telefonia Mobile', icon: Smartphone },
  { id: 'internet', name: 'Telefonia fissa / Internet', icon: Wifi },
  { id: 'tv', name: 'Pay TV', icon: Tv },
  { id: 'energy', name: 'Energia', icon: Zap },
  { id: 'insurance', name: 'Assicurazioni', icon: Shield },
  { id: 'gym', name: 'Palestre / abbonamenti vari', icon: Dumbbell }
]

const steps = [
  {
    icon: FileEdit,
    title: '1. Compila il modulo',
    description: 'Seleziona il fornitore, inserisci i tuoi dati e firma digitalmente la disdetta in pochi click.'
  },
  {
    icon: Send,
    title: '2. Noi spediamo',
    description: 'Invieremo la tua disdetta tramite PEC con pieno valore legale.'
  },
  {
    icon: CheckCircle,
    title: '3. Ricevi conferma',
    description: 'Riceverai la ricevuta di accettazione e consegna direttamente nella tua area riservata.'
  }
]

const benefits = [
  { icon: Scale, title: 'Valore Legale 100%', description: 'Le nostre raccomandate hanno lo stesso valore di quelle fatte in posta.' },
  { icon: PiggyBank, title: 'Risparmia Denaro', description: 'Evita rinnovi automatici indesiderati e costi nascosti.' },
  { icon: Clock, title: 'Risparmia Tempo', description: 'Bastano 2 minuti. Niente file, niente parcheggi, niente stress.' },
  { icon: Headphones, title: 'Supporto Dedicato', description: 'Il nostro team ti assiste in caso di problemi con il fornitore.' },
  { icon: Lock, title: 'Sicurezza Dati', description: 'I tuoi dati sono criptati e gestiti nel rispetto della privacy.' },
  { icon: Archive, title: 'Archivio Digitale', description: 'Tieni traccia di tutte le tue disdette in un unico posto.' }
]

const testimonials = [
  { initial: 'M', name: 'Marco R.', text: 'Servizio eccezionale! Ho disdetto Sky in 5 minuti senza dover mandare raccomandate in posta. Consigliatissimo.' },
  { initial: 'G', name: 'Giulia B.', text: 'Finalmente un sito chiaro e trasparente. Costa poco e fa risparmiare un sacco di tempo e mal di pancia.' },
  { initial: 'L', name: 'Luca T.', text: 'Utilizzato per una pratica di cambio operatore energia. Tutto perfetto, ricevuta arrivata in 24h.' }
]

const faqs = [
  {
    id: 1,
    question: 'La disdetta è legalmente valida?',
    answer: 'Assolutamente sì. Utilizziamo la PEC (Posta Elettronica Certificata), che ha pieno valore legale e probatorio di fronte a qualsiasi ente, azienda o fornitore.'
  },
  {
    id: 2,
    question: 'Quanto costa il servizio?',
    answer: 'Il prezzo parte da soli 6,99€ per pratica. Il costo finale è trasparente e dipende dal costo della PEC, ma non ci sono mai costi nascosti o abbonamenti ricorrenti.'
  },
  {
    id: 3,
    question: 'Quanto ci mette?',
    answer: 'La compilazione online richiede meno di 2 minuti. Una volta confermata e pagata la pratica, i nostri sistemi elaborano e spediscono la disdetta entro 24 ore lavorative.'
  },
  {
    id: 4,
    question: 'Serve la PEC?',
    answer: 'No, non è necessario che tu possieda una casella PEC. Se scegli l\'invio tramite PEC, utilizzeremo la nostra PEC istituzionale per inviare la disdetta per tuo conto, garantendo la consegna legale.'
  },
  {
    id: 5,
    question: 'Che dati servono?',
    answer: 'Ti serviranno semplicemente i dati anagrafici dell\'intestatario (Nome, Cognome, Codice Fiscale) e i riferimenti del contratto da disdire (es. numero cliente o numero contratto), che trovi su qualsiasi bolletta.'
  },
  {
    id: 6,
    question: 'Posso disdire per conto di un familiare?',
    answer: 'Sì, certamente. Durante la procedura guidata potrai indicare di essere un delegato. Ti verranno richiesti i tuoi dati e quelli dell\'intestatario del contratto per generare la delega corretta.'
  },
  {
    id: 7,
    question: 'Fate anche reclami?',
    answer: 'Al momento il nostro focus principale è sulle disdette contrattuali, ma stiamo lavorando per integrare presto una sezione dedicata alla gestione dei reclami e delle richieste di rimborso per disservizi.'
  }
]

export default function HomePage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-40">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 to-pink-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 to-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Hero content */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-5xl text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:leading-[1.1]"
          >
            Disdire i tuoi contratti non è mai stato così{' '}
            <span className="text-transparent bg-clip-text bg-gradient-primary relative inline-block">
              easy
              <svg className="absolute bottom-1 left-0 w-full h-3 text-indigo-600 -z-10" preserveAspectRatio="none" viewBox="0 0 100 10">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="8" />
              </svg>
            </span>
            <br/>Solo 6,99€ a pratica
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 sm:text-xl"
          >
            Il servizio online numero 1 in Italia per inviare disdette con pieno valore legale.<br className="hidden sm:block" />
            <span className="font-bold text-indigo-600">Nessun costo nascosto, nessun abbonamento, nessuna fregatura.</span>
          </motion.p>

          {/* Category Selector Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-12 max-w-4xl transform rounded-2xl bg-white/80 backdrop-blur-sm p-2 shadow-xl"
          >
            <div className="flex flex-col gap-6 p-4 sm:p-8">
              <h3 className="text-2xl font-bold text-gray-900">Inizia subito</h3>

              {/* Progress indicator */}
              <div className="relative w-full mb-4">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full -z-10" />
                <div className="flex justify-between items-center w-full max-w-3xl mx-auto px-2">
                  <div className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-xs font-bold ring-4 ring-white">1</div>
                    <span className="text-xs font-bold text-indigo-600">Categoria</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-xs font-bold ring-4 ring-white">2</div>
                    <span className="text-xs font-medium text-gray-500 hidden sm:block">Operatore</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-xs font-bold ring-4 ring-white">3</div>
                    <span className="text-xs font-medium text-gray-500 hidden sm:block">Servizio</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-xs font-bold ring-4 ring-white">4</div>
                    <span className="text-xs font-medium text-gray-500 hidden sm:block">Caricamento</span>
                  </div>
                </div>
              </div>

              {/* Categories grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category, index) => {
                  const Icon = category.icon
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                    >
                      <Link href="/new-disdetta">
                        <div className="h-full flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-indigo-600 hover:bg-indigo-50 hover:shadow-md transition-all group cursor-pointer">
                          <div className="p-3 rounded-full bg-white shadow-sm text-gray-600 group-hover:text-indigo-600 group-hover:bg-white">
                            <Icon className="h-6 w-6" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 text-center">
                              {category.name}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Stats badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12 opacity-80"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-indigo-500 h-6 w-6" />
              <span className="text-sm font-medium text-gray-600">Valore Legale Garantito</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="text-indigo-500 h-6 w-6" />
              <span className="text-sm font-medium text-gray-600">50.000+ Utenti Soddisfatti</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {[...Array(4)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                <Star className="h-5 w-5 fill-current opacity-50" />
              </div>
              <span className="text-sm font-bold text-gray-800">4.8/5</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-indigo-500 text-sm font-bold tracking-widest uppercase mb-3">Come funziona</p>
              <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Disdire in 3 semplici passi</h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Non serve fare la fila alla posta o cercare moduli incomprensibili. Ci pensiamo noi a tutto.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110">
                    <Icon className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-pink-200 to-transparent z-0" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Perché scegliere DisdEasy?</h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col gap-4 rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-card hover:border-indigo-500/50 transition-colors border border-transparent"
                >
                  <div className="flex size-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900">{benefit.title}</h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* B2B Banner */}
      <section className="relative py-24 bg-gradient-to-r from-indigo-600 to-pink-500">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Sei un'azienda? Gestisci pratiche e disdette in modo automatizzato.
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Soluzioni personalizzate per la gestione massiva di recessi e comunicazioni legali.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-bold text-indigo-600 shadow-lg hover:bg-gray-50 transition-all"
            >
              Contattaci per un preventivo
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900">Cosa dicono di noi</h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6"
              >
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-6 flex-grow">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                    {testimonial.initial}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">Utente verificato</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-500 px-6 py-12 text-center shadow-2xl sm:px-12 sm:py-16"
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Pronto a liberarti dai contratti inutili?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
                Unisciti a migliaia di italiani che hanno già semplificato la loro vita con DisdEasy.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link
                  href="/new-disdetta"
                  className="flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-bold text-indigo-600 shadow-lg hover:bg-gray-50 transition-colors"
                >
                  Inizia ora la tua disdetta
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900">Domande Frequenti</h2>
            <p className="mt-4 text-gray-600">Tutto quello che devi sapere per disdire in tranquillità.</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 shadow-card overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between gap-1.5 p-6 text-gray-900 hover:bg-white/50 transition-colors text-left"
                >
                  <h3 className="font-bold">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: expandedFaq === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 text-gray-600 border-t border-white/50">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}