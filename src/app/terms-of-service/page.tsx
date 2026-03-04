'use client'

import { motion } from 'framer-motion'
import { FileText, Calendar } from 'lucide-react'

export default function TermsPage() {
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
             Termini e Condizioni di Servizio
           </h1>
           <div className="flex items-center justify-center gap-2 text-gray-600">
             <Calendar className="h-4 w-4" />
             <p>Ultimo aggiornamento: [DA COMPILARE: GG/MM/2025]</p>
           </div>
         </motion.div>
       </div>
     </div>

     {/* Content */}
     <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.2 }}
         className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 md:p-12 shadow-lg"
       >
         <div className="prose prose-lg max-w-none">
           {/* Section 1 */}
           <section id="informazioni-titolare" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">1. Informazioni sul Titolare</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               Il presente servizio ("Piattaforma" o "Servizio") è gestito da:
             </p>
             <div className="bg-primary-50 rounded-xl p-6 border border-primary-100 mb-4">
               <p className="text-gray-800 mb-2"><strong>[DA COMPILARE: NOME SOCIETÀ]</strong></p>
               <p className="text-gray-700 mb-1">Sede legale: <strong>[DA COMPILARE: SEDE LEGALE]</strong></p>
               <p className="text-gray-700 mb-1">P.IVA: <strong>[DA COMPILARE: P.IVA]</strong></p>
               <p className="text-gray-700 mb-1">Email: <strong>[DA COMPILARE: Email]</strong></p>
               <p className="text-gray-700">PEC: <strong>[DA COMPILARE: PEC]</strong></p>
             </div>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
               La piattaforma opera commercialmente con il nome <strong>DisdEasy</strong>.
             </p>
           </section>

           {/* Section 2 */}
           <section id="definizioni" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">2. Definizioni</h2>
             <ul className="space-y-3">
               <li>
                 <strong className="text-gray-900">Utente/Cliente:</strong>{' '}
                 <span className="text-gray-700">
                   la persona fisica intestataria del rapporto contrattuale con la Società destinataria della comunicazione.
                 </span>
               </li>
               <li>
                 <strong className="text-gray-900">Piattaforma/DisdEasy:</strong>{' '}
                 <span className="text-gray-700">
                   il servizio digitale gestito da [DA COMPILARE: NOME SOCIETÀ].
                 </span>
               </li>
               <li>
                 <strong className="text-gray-900">Società destinataria:</strong>{' '}
                 <span className="text-gray-700">
                   il soggetto terzo verso cui la comunicazione viene inviata (es. operatori telefonici, pay TV, utilities, ecc.).
                 </span>
               </li>
               <li>
                 <strong className="text-gray-900">Comunicazione:</strong>{' '}
                 <span className="text-gray-700">
                   disdetta, recesso, reclamo, diffida, richiesta formale o altra comunicazione generata e inviata tramite la Piattaforma.
                 </span>
               </li>
             </ul>
           </section>

           {/* Section 3 */}
           <section id="oggetto-servizio" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">3. Oggetto del Servizio</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               DisdEasy fornisce:
             </p>
             <ol className="list-decimal list-inside space-y-2 mb-4">
               <li className="text-sm sm:text-base text-gray-700">Generazione automatizzata di comunicazioni personalizzate, basate sui dati forniti dall'Utente.</li>
               <li className="text-sm sm:text-base text-gray-700">Invio della comunicazione per conto dell'Utente, tramite PEC, raccomandata digitale o sistemi equivalenti.</li>
               <li className="text-sm sm:text-base text-gray-700">Archiviazione di documenti, ricevute PEC e log tecnici.</li>
             </ol>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               DisdEasy opera come <strong>mandatario con rappresentanza</strong>, limitatamente all'attività di:
             </p>
             <ul className="list-disc list-inside space-y-2 mb-4">
               <li className="text-sm sm:text-base text-gray-700">redigere la Comunicazione su istruzione dell'Utente,</li>
               <li className="text-sm sm:text-base text-gray-700">firmarla digitalmente ove richiesto dai sistemi PEC,</li>
               <li className="text-sm sm:text-base text-gray-700">trasmetterla alla Società destinataria,</li>
               <li className="text-sm sm:text-base text-gray-700">conservare la prova dell'invio.</li>
             </ul>
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
               <p className="text-gray-800 font-medium">
                 ⚠️ La Piattaforma non presta consulenza legale personalizzata, non valuta il merito della controversia, 
                 non redige atti difensivi giudiziali e non sostituisce l'avvocato.
               </p>
             </div>
           </section>

           {/* Section 4 */}
           <section id="mandato" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">4. Mandato con rappresentanza - Conferimento</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               Il mandato si intende conferito dall'Utente mediante:
             </p>
             <ol className="list-decimal list-inside space-y-2 mb-4">
               <li className="text-sm sm:text-base text-gray-700">caricamento del documento d'identità;</li>
               <li className="text-sm sm:text-base text-gray-700">compilazione dei dati richiesti;</li>
               <li className="text-sm sm:text-base text-gray-700">selezione della checkbox contenente l'autorizzazione;</li>
               <li className="text-sm sm:text-base text-gray-700">conferma della richiesta di invio.</li>
             </ol>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
               Il mandato ha ad oggetto la sola trasmissione della comunicazione predisposta in base ai dati inseriti dall'Utente.
             </p>
           </section>

           {/* Section 5 */}
           <section id="veridicita" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">5. Veridicità delle informazioni e responsabilità dell'Utente</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               L'Utente dichiara e garantisce che:
             </p>
             <ul className="list-disc list-inside space-y-2 mb-4">
               <li className="text-sm sm:text-base text-gray-700">è titolare effettivo del rapporto contrattuale oggetto della comunicazione;</li>
               <li className="text-sm sm:text-base text-gray-700">i dati forniti sono veri, completi e aggiornati;</li>
               <li className="text-sm sm:text-base text-gray-700">i documenti allegati sono autentici e validi;</li>
               <li className="text-sm sm:text-base text-gray-700">l'utilizzo della Piattaforma non viola diritti di terzi.</li>
             </ul>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               L'Utente si assume ogni responsabilità per dichiarazioni false (DPR 445/2000).
             </p>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
               L'Utente manleva integralmente la Piattaforma da qualsiasi conseguenza derivante da:
             </p>
             <ul className="list-disc list-inside space-y-2">
               <li className="text-sm sm:text-base text-gray-700">errori nei dati forniti,</li>
               <li className="text-sm sm:text-base text-gray-700">documenti falsi o non leggibili,</li>
               <li className="text-sm sm:text-base text-gray-700">contestazioni della Società destinataria relative alla legittimazione.</li>
             </ul>
           </section>

           {/* Section 6 */}
           <section id="limitazioni" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">6. Limitazioni di responsabilità della Piattaforma</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               DisdEasy risponde esclusivamente della corretta generazione e trasmissione tecnica della comunicazione.
             </p>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               Non risponde, a titolo esemplificativo, di:
             </p>
             <ul className="list-disc list-inside space-y-2 mb-4">
               <li className="text-sm sm:text-base text-gray-700">ritardi, errori o rifiuti della Società destinataria;</li>
               <li className="text-sm sm:text-base text-gray-700">mancata ricezione causata da caselle PEC piene/chiuse/non attive;</li>
               <li className="text-sm sm:text-base text-gray-700">interruzioni tecniche dei provider PEC o servizi terzi;</li>
               <li className="text-sm sm:text-base text-gray-700">utilizzo fraudolento del servizio da parte di terzi;</li>
               <li className="text-sm sm:text-base text-gray-700">mancato esito desiderato (es. mancato recesso, mancato rimborso).</li>
             </ul>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
               Il servizio viene fornito "as is", senza garanzia di risultato.
             </p>
           </section>

           {/* Section 7 */}
           <section id="disponibilita" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">7. Disponibilità del Servizio</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               DisdEasy non garantisce l'assenza di interruzioni o errori.
             </p>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               Potranno verificarsi:
             </p>
             <ul className="list-disc list-inside space-y-2 mb-4">
               <li className="text-sm sm:text-base text-gray-700">manutenzioni programmate;</li>
               <li className="text-sm sm:text-base text-gray-700">sospensioni per motivi tecnici o di sicurezza;</li>
               <li className="text-sm sm:text-base text-gray-700">blocchi temporanei dei provider di invio.</li>
             </ul>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
               L'Utente non avrà diritto a indennizzi o rimborsi per downtime o interruzioni.
             </p>
           </section>

           {/* Section 8 */}
           <section id="prezzi" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">8. Prezzi, pagamenti e fatturazione</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               I prezzi sono indicati prima dell'acquisto.
             </p>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               Il pagamento avviene tramite i metodi disponibili sulla Piattaforma.
             </p>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               Fatture e ricevute sono emesse secondo normativa vigente.
             </p>
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
               <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">⚠️ Recesso non applicabile</h3>
               <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                 Ai sensi dell'art. 59, lett. o) del Codice del Consumo, non si applica il diritto di recesso:
               </p>
               <p className="text-gray-700 italic mt-2">
                 "per servizi digitali personalizzati eseguiti con il consenso espresso del consumatore prima della scadenza del periodo di recesso."
               </p>
             </div>
           </section>

           {/* Section 9 */}
           <section id="uso-illecito" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">9. Uso illecito del Servizio</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               È vietato utilizzare la Piattaforma per:
             </p>
             <ul className="list-disc list-inside space-y-2 mb-4">
               <li className="text-sm sm:text-base text-gray-700">inviare comunicazioni diffamatorie, minacciose o abusive;</li>
               <li className="text-sm sm:text-base text-gray-700">impersonare terzi;</li>
               <li className="text-sm sm:text-base text-gray-700">eseguire attività fraudolente;</li>
               <li className="text-sm sm:text-base text-gray-700">generare massa di comunicazioni seriali non autorizzate.</li>
             </ul>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
               DisdEasy potrà sospendere o chiudere l'account dell'Utente in caso di uso contrario a legge o ai Termini.
             </p>
           </section>

           {/* Section 10 */}
           <section id="modifica" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">10. Modifica dei Termini</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               DisdEasy può modificare i presenti Termini per esigenze normative o tecniche.
             </p>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               Le modifiche saranno comunicate mediante:
             </p>
             <ul className="list-disc list-inside space-y-2 mb-4">
               <li className="text-sm sm:text-base text-gray-700">pubblicazione sul sito, oppure</li>
               <li className="text-sm sm:text-base text-gray-700">email all'Utente registrato.</li>
             </ul>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
               L'uso continuato della Piattaforma implica accettazione dei Termini aggiornati.
             </p>
           </section>

           {/* Section 11 */}
           <section id="legge" className="mb-8">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">11. Legge applicabile e foro competente</h2>
             <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
               I presenti Termini sono regolati dalla legge italiana.
             </p>
             <ul className="list-disc list-inside space-y-2">
               <li className="text-sm sm:text-base text-gray-700">Se l'Utente è consumatore → foro del luogo di residenza.</li>
               <li className="text-sm sm:text-base text-gray-700">Se l'Utente è professionista → foro esclusivo Roma.</li>
             </ul>
           </section>
         </div>
       </motion.div>
     </div>
   </div>
 )
}