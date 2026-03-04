'use client'

import { motion } from 'framer-motion'
import { Scale, Cpu, Eye, Rocket, BookOpen, Link as LinkIcon, Mail, ArrowRight, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function ChiSiamoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50">

      {/* Hero Section */}
      <section className="bg-white/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
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
              Chi Siamo
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed">
              Disdire non dovrebbe essere complicato. Noi siamo qui per cambiarlo.
            </p>

          </motion.div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
            <div className="text-center">
              <span className="inline-block px-4 py-1 rounded-full bg-white text-primary-700 text-xs font-bold border border-primary-600 uppercase tracking-wider mb-4">
                La Nostra Mission
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
              >
                Rendere semplice ciò che è sempre stato difficile
              </h2>
            </div>

            <div className="space-y-6 max-w-5xl mx-auto text-center">
              <p className="text-lg text-gray-600 leading-relaxed">
                DisdEasy nasce per chiudere un contratto in modo veloce, trasparente e legalmente corretto.
              </p>
              
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-6"></div>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Crediamo che ogni persona e ogni impresa debbano poter gestire i propri contratti
                senza perdere tempo tra moduli incomprensibili, call center e procedure poco chiare.
                DisdEasy è una piattaforma digitale che permette di disdire contratti in pochi minuti,
                con una procedura semplice e una forma giuridicamente corretta.
              </p>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                La nostra missione è rendere la gestione amministrativa più semplice e accessibile,
                eliminando inutili complessità e restituendo alle persone il controllo delle proprie scelte.
              </p>
            </div>
        </div>
      </section>

      {/* Filosofia Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-white text-primary-700 text-xs border border-primary-600 font-bold uppercase tracking-wider mb-4">
              La Nostra Filosofia
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Semplicità, trasparenza, affidabilità
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Non dovrebbe servire un esperto per chiudere un contratto.
            </p>
          </div>

          {/* 3 Pilastri - Card Separate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Semplicità</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Pochi dati, pochi passaggi, nessuna complicazione inutile.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Trasparenza</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Paghi solo per la pratica che utilizzi. Nessun abbonamento nascosto.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Affidabilità</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ogni richiesta è redatta con il supporto di consulenti legali per garantire efficacia.
              </p>
            </motion.div>
          </div>

          {/* Obiettivo futuro */}
          <div className="bg-gradient-primary rounded-2xl p-12">
            <p className="text-lg text-white/90 text-center max-w-4xl mx-auto font-bold">
              Il nostro obiettivo è costruire una piattaforma capace di semplificare tutte le principali 
              pratiche amministrative: dalle disdette ai reclami, dai rimborsi alle pratiche assicurative.
            </p>
          </div>
        </div>
      </section>

      {/* Storia Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                DisdEasy nasce da un&apos;esperienza molto concreta.
              </h3>

              <p className="text-lg text-gray-600 leading-relaxed">
                Nel corso degli anni ci siamo trovati più volte ad affrontare procedure di disdetta
                lunghe e frustranti: contratti di telefonia, utenze domestiche, abbonamenti televisivi.
                Ogni volta la stessa situazione: moduli difficili da trovare, informazioni poco chiare,
                documenti da compilare manualmente e l&apos;incertezza che la richiesta fosse davvero corretta.
              </p>

              <p className="text-lg text-gray-600 leading-relaxed">
                Ma il momento in cui abbiamo capito davvero il problema è stato quando abbiamo aiutato
                i nostri genitori a disdire alcuni contratti. Quello che per noi era solo scomodo,
                per loro era diventato complicato e stressante. È stato allora che abbiamo capito che
                non serviva un altro sito di moduli da scaricare. Serviva un servizio semplice,
                guidato e affidabile. Da questa idea nasce DisdEasy.
              </p>

              <div className="hidden md:flex flex items-center gap-4">
                <div className="h-px bg-gray-300 flex-1"></div>
                <BookOpen className="w-6 h-6 text-primary-600" />
                <div className="h-px bg-gray-300 flex-1"></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="hidden md:flex relative h-80 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl group"
            >
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8hWM6LzsaZRcFssHamlKLfk7mIGtdOu68CqAZ3jxj1Dq26kkcNLRAXvdnyPok5Dyfxwz02YqEG82Zu3Ao1Uidjbibg1oNBnIIpsWI4mSBIbQVxPArRujOTxdsvizf91cyjsjVR9sJ4cE4yIxsxvoJD3gXpPcGzBlmT4dpWdZOvBrflQ5ypZP7gRRE-BniGSDzS5xUAeq4qQHz4hqutpfZIgvsLUu7EQ-ccxJeLivWp-P4yucrD-alfpi_AWaU7jLf8LnXe05DA76H"
                alt="Data visualization and technology"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                <p className="font-bold text-white text-sm">Automazione Legale</p>
                <p className="text-white/80 text-xs">Processi certificati e sicuri</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Cards Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 - Solidità Legale */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                <Scale className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Solidità Legale</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ogni procedura è validata da un team di avvocati esperti per garantire conformità totale.
              </p>
            </motion.div>

            {/* Card 2 - Tecnologia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 text-teal-600 mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Tecnologia Proprietaria</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Algoritmi sviluppati internamente per automatizzare l&apos;invio e il tracciamento delle pratiche.
              </p>
            </motion.div>

            {/* Card 3 - Trasparenza */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
                <Eye className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Trasparenza</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Nessun costo nascosto. Sai sempre cosa paghi e a che punto è la tua pratica.
              </p>
            </motion.div>

            {/* Card 4 - Visione */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-4">
                <Rocket className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Visione a Lungo Termine</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Costruiamo un futuro dove la burocrazia è un ricordo e la libertà contrattuale è la norma.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Il Team</h2>
            <p className="text-xl text-gray-600">
              Competenze diverse, un obiettivo comune: semplificare la gestione dei contratti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Alessio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:-translate-y-2 transition-transform"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-white shadow-lg relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMoBbRkBHIL-NHaatLrn9z6RyJdpWAyLK69v6fsGjJk6y7Gpvjv1ug5wamIoTwBvn0k_LMG1A0OvBNWLKdnLSQr3C_NwHuh7gIIVXbQTpO8NYPWKo3zmTZK8lR6nizJgI6vaTm_ymKBGlmZX4hS8BmsfMRZh6e4FhVJ01rC1k-03JdDIyLbXRyb_NJRuGDKW61a2OcG_tQmSgNS_emjQXbJHyNjbMBF3sP7jfiYpxQ-EELkU86BXjega0DobApwuhST1E6fOiE8F2N"
                  alt="Alessio Giampaoli"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Alessio Giampaoli</h3>
              <p className="text-primary-600 font-medium text-sm text-center mb-4">Co-Founder – Business & Growth</p>
              <p className="text-gray-600 text-sm leading-relaxed text-center">
                Alessio è responsabile dello sviluppo strategico e della crescita di DisdEasy.
                Con oltre dieci anni di esperienza nel marketing digitale e nello sviluppo di
                progetti innovativi, si occupa della definizione del modello di business e della
                crescita della piattaforma. In DisdEasy coordina la visione del progetto e lo
                sviluppo commerciale con l&apos;obiettivo di costruire un servizio scalabile e accessibile.
              </p>
              <div className="flex justify-center gap-3 mt-6">
                <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <LinkIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </motion.div>

            {/* Mattia - con badge "Tech Vision" */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:-translate-y-2 transition-transform relative md:-mt-8"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Tech Vision
              </div>
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-white shadow-lg relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhGrIJI4joa3a6eWlGFrGC-T4kq_HhelLmUWSYHbNT6sR-mF9QNvLfNyQt7luLqhe8DB7ctQ7AYIHfRCnIfewW9BbTGpA39MI6m-ocwsUr6pdiv-q0aPpVfQ6blxKGZXD2QG3XFybtIy7e6yZo0kw4Oxz-4KH09CRB1lmcIGTFhB47L8srUn1T6DH7dc83I0NEmBWfnrbH3lzx2iXZpOoAOCCPL2kKor3snD9qAlkvBCzD0XOniOkXkdzUfPzjcs988zDxhsd6x0uA"
                  alt="Mattia Vena"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Mattia Vena</h3>
              <p className="text-primary-600 font-medium text-sm text-center mb-4">Co-Founder – Technology</p>
              <p className="text-gray-600 text-sm leading-relaxed text-center">
                Mattia è responsabile dello sviluppo tecnologico della piattaforma. Si occupa
                dell&apos;architettura tecnica e dello sviluppo delle soluzioni che permettono di
                automatizzare la gestione delle pratiche in modo semplice e affidabile. In DisdEasy
                guida lo sviluppo del prodotto con particolare attenzione all&apos;efficienza e alla
                scalabilità della piattaforma.
              </p>
              <div className="flex justify-center gap-3 mt-6">
                <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <LinkIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </motion.div>

            {/* Lorenzo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:-translate-y-2 transition-transform"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-white shadow-lg relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhXm1Yc7fMU5tMdIhyiCRRV89hdEvAgfT59U4vxJuHQfS3wvzOoRTvJbWnfqGG9iFnXWy5Eb5jiksWmJq7rpyXsxcxaVeCD-PqXn46cjqfEoUsFtxXqBzwTt7WSzopywx42TdqnvMLNi1KvrYwpp6eyJ7OqIRZ-22AnyXzrQKLJyGqWpQ19NhpnTA8BIGRFhpMQXLdppIklN70Mhvrz0S3u4q9l7qAALPFxQe64ilfh7t7hzJQaQnlcqQ0_cF8x0REOtMi5k8fDmat"
                  alt="Lorenzo Mazzeo"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Lorenzo Mazzeo</h3>
              <p className="text-primary-600 font-medium text-sm text-center mb-4">Co-Founder – Legal</p>
              <p className="text-gray-600 text-sm leading-relaxed text-center">
                Avvocato del Foro di Roma, Lorenzo garantisce la solidità legale del servizio.
                Dopo la laurea presso l&apos;Università LUISS Guido Carli e il conseguimento del Master
                presso l&apos;Università La Sapienza, ha maturato una significativa esperienza nel diritto
                assicurativo e nella tutela del cliente. Nel 2018 ha fondato lo Studio Legale Mazzeo con
                l&apos;obiettivo di offrire servizi legali moderni e orientati alle reali esigenze delle persone.
                In DisdEasy supervisiona gli aspetti giuridici delle pratiche, assicurando che ogni richiesta
                sia formalmente corretta ed efficace.
              </p>
              <div className="flex justify-center gap-3 mt-6">
                <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <LinkIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  )
}