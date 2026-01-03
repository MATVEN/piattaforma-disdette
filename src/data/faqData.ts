// src/data/faqData.ts
// FAQ content organized by category

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

export interface FAQCategory {
  id: string
  name: string
  icon: string // Lucide icon name
  color: string // Tailwind color class
}

export const faqCategories: FAQCategory[] = [
  {
    id: 'come-funziona',
    name: 'Come funziona',
    icon: 'Rocket',
    color: 'indigo',
  },
  {
    id: 'tempi',
    name: 'Tempi e procedure',
    icon: 'Clock',
    color: 'purple',
  },
  {
    id: 'costi',
    name: 'Costi e pagamenti',
    icon: 'Euro',
    color: 'pink',
  },
  {
    id: 'problemi',
    name: 'Problemi comuni',
    icon: 'AlertCircle',
    color: 'orange',
  },
  {
    id: 'documenti',
    name: 'Documenti necessari',
    icon: 'FileText',
    color: 'blue',
  },
  {
    id: 'sicurezza',
    name: 'Sicurezza e privacy',
    icon: 'Shield',
    color: 'green',
  },
  {
    id: 'supporto',
    name: 'Supporto',
    icon: 'MessageCircle',
    color: 'cyan',
  },
]

export const faqItems: FAQItem[] = [
  // COME FUNZIONA
  {
    id: 'cf-1',
    category: 'come-funziona',
    question: 'Come funziona DisdEasy?',
    answer: 'DisdEasy automatizza il processo di disdetta in 4 semplici step: 1) Carichi la bolletta del fornitore da cui vuoi recedere, 2) Il nostro sistema estrae automaticamente i dati del contratto, 3) Verifichi e confermi i dati estratti, 4) Inviamo la PEC di disdetta al fornitore per te. Tutto in pochi minuti!',
  },
  {
    id: 'cf-2',
    category: 'come-funziona',
    question: 'Quali fornitori sono supportati?',
    answer: 'Supportiamo tutti i principali fornitori di luce, gas e telefonia in Italia, tra cui Enel, Eni, A2A, Edison, TIM, Vodafone, WindTre, Fastweb e molti altri. Se il tuo fornitore non è nella lista, contattaci e lo aggiungeremo!',
  },
  {
    id: 'cf-3',
    category: 'come-funziona',
    question: 'Cosa succede dopo aver inviato la disdetta?',
    answer: 'Dopo l\'invio della PEC, il fornitore ha 30 giorni per confermare la ricezione e processare la disdetta. Riceverai una copia della PEC inviata e potrai monitorare lo stato nella dashboard. Ti notificheremo quando il fornitore confermerà la disdetta.',
  },
  {
    id: 'cf-4',
    category: 'come-funziona',
    question: 'Posso usare DisdEasy per più contratti?',
    answer: 'Sì, puoi gestire tutte le disdette che vuoi dallo stesso account. Ogni contratto viene processato separatamente e puoi monitorare lo stato di ciascuno nella tua dashboard personale.',
  },
  {
    id: 'cf-5',
    category: 'come-funziona',
    question: 'È necessaria la PEC per inviare una disdetta?',
    answer: 'Sì, la PEC (Posta Elettronica Certificata) è l\'unico metodo legalmente valido per inviare disdette di contratti in Italia. DisdEasy si occupa di tutto: noi generiamo e inviamo la PEC per te, garantendo validità legale e tracciabilità.',
  },

  // TEMPI E PROCEDURE
  {
    id: 'tp-1',
    category: 'tempi',
    question: 'Quanto tempo ci vuole per completare una disdetta?',
    answer: 'Il caricamento e l\'invio della disdetta richiedono solo 5-10 minuti. L\'elaborazione automatica dei dati avviene in tempo reale. La PEC viene inviata immediatamente dopo la tua conferma. I tempi di accettazione da parte del fornitore variano da 7 a 30 giorni.',
  },
  {
    id: 'tp-2',
    category: 'tempi',
    question: 'Quando diventa effettiva la disdetta?',
    answer: 'La disdetta diventa effettiva secondo i termini contrattuali del tuo fornitore, generalmente entro 30 giorni dalla ricezione della PEC. Alcuni contratti prevedono un preavviso minimo (es. 30 giorni), che verrà rispettato automaticamente.',
  },
  {
    id: 'tp-3',
    category: 'tempi',
    question: 'Posso annullare una disdetta dopo averla inviata?',
    answer: 'Una volta inviata la PEC di disdetta, non è possibile annullarla tramite la piattaforma. Dovrai contattare direttamente il fornitore per richiedere l\'annullamento. Ti consigliamo di verificare attentamente tutti i dati prima di confermare l\'invio.',
  },
  {
    id: 'tp-4',
    category: 'tempi',
    question: 'Riceverò una conferma di ricezione della PEC?',
    answer: 'Sì, la PEC include ricevute di consegna e accettazione che confermano che il fornitore ha ricevuto la tua disdetta. Riceverai una copia di queste ricevute via email e potrai visualizzarle nella dashboard.',
  },
  {
    id: 'tp-5',
    category: 'tempi',
    question: 'Cosa succede se il fornitore non risponde?',
    answer: 'Se dopo 30 giorni il fornitore non ha processato la disdetta, contattaci e ti aiuteremo a sollecitare una risposta. La PEC ha valore legale e il fornitore è obbligato a processare la tua richiesta nei tempi contrattuali.',
  },

  // COSTI E PAGAMENTI
  {
    id: 'cp-1',
    category: 'costi',
    question: 'Quanto costa il servizio?',
    answer: 'Il servizio ha un costo fisso per ogni disdetta inviata. Non ci sono costi nascosti, abbonamenti o commissioni aggiuntive. Paghi solo quando invii effettivamente una disdetta. Contatta il supporto per informazioni sui prezzi attuali.',
  },
  {
    id: 'cp-2',
    category: 'costi',
    question: 'Quali metodi di pagamento accettate?',
    answer: 'Accettiamo carte di credito/debito (Visa, Mastercard, American Express) tramite Stripe, il nostro partner sicuro per i pagamenti. Non memorizziamo i dati della tua carta sui nostri server.',
  },
  {
    id: 'cp-3',
    category: 'costi',
    question: 'Posso avere un rimborso?',
    answer: 'I rimborsi sono disponibili entro 24 ore dall\'invio della disdetta se si verifica un errore tecnico da parte nostra. Se la PEC non viene consegnata per problemi tecnici della piattaforma, il rimborso è automatico. Contatta il supporto per richiedere un rimborso.',
  },
  {
    id: 'cp-4',
    category: 'costi',
    question: 'Ci sono sconti per più disdette?',
    answer: 'Attualmente ogni disdetta ha lo stesso prezzo fisso. Stiamo valutando pacchetti scontati per utenti che devono gestire più contratti contemporaneamente. Iscriviti alla newsletter per essere informato sulle promozioni.',
  },

  // PROBLEMI COMUNI
  {
    id: 'pc-1',
    category: 'problemi',
    question: "Errore nel caricamento della bolletta: perché l’upload fallisce?",
    answer: "L’upload della bolletta può fallire se il file supera i 5MB o non è in formato PDF, PNG o JPG. Verifica anche la connessione internet e prova a ricaricare il file da un altro browser o dispositivo. Se necessario, comprimi il file o ottimizza il PDF prima di riprovare."
  },
  {
    id: 'pc-2',
    category: 'problemi',
    question: "La bolletta non viene riconosciuta dal sistema: cosa posso fare?",
    answer: "Se la bolletta non viene riconosciuta, assicurati che l’immagine o il PDF siano leggibili, non sfocati e correttamente orientati. In caso di riconoscimento parziale, puoi inserire manualmente i dati nella pagina di revisione. Se il problema persiste, contatta il supporto allegando la bolletta."
  },
  {
    id: 'pc-3',
    category: 'problemi',
    question: "La pagina di revisione della disdetta è vuota: è un errore?",
    answer: "La pagina di revisione può risultare vuota se l’elaborazione OCR della bolletta non è ancora completata. Attendi qualche secondo e ricarica la pagina. Se dopo 2 minuti la situazione non cambia, verifica lo stato della disdetta nella dashboard."
  },
  {
    id: 'pc-4',
    category: 'problemi',
    question: "I dati della disdetta sono errati o incompleti: come li correggo?",
    answer: "Prima di inviare la disdetta puoi modificare manualmente tutti i dati estratti dal sistema. I campi obbligatori sono evidenziati. Presta particolare attenzione a POD/PDR, numero cliente e P.IVA del fornitore. Se l’OCR ha estratto dati errati, puoi correggerli senza problemi."
  },
  {
    id: 'pc-5',
    category: 'problemi',
    question: "Come controllare lo stato della disdetta online?",
    answer: "Puoi verificare lo stato di ogni disdetta direttamente dalla dashboard. Gli stati disponibili includono: PROCESSING (in elaborazione), PENDING_REVIEW (pronta per la revisione), CONFIRMED (confermata) e TEST_SENT/SENT (PEC inviata)."
  },
  {
    id: 'pc-6',
    category: 'problemi',
    question: "Non ricevo le email di DisdEasy: cosa devo controllare?",
    answer: "Se non ricevi le email di notifica, controlla la cartella spam o posta indesiderata. Assicurati che l’indirizzo email nel tuo profilo sia corretto e aggiungi noreply@DisdEasy.it ai contatti fidati. Se dopo 10 minuti non ricevi comunicazioni, contatta il supporto."
  },
  {
    id: 'pc-7',
    category: 'problemi',
    question: "La PEC di disdetta non risulta ricevuta: è stata inviata?",
    answer: "La PEC viene inviata direttamente al fornitore. Puoi verificare l’invio nella dashboard: se lo stato è TEST_SENT o SENT, la PEC è stata correttamente spedita con valore legale. In caso contrario, la PEC non è stata ancora inviata e potrebbe essere necessario intervenire."
  },

  // DOCUMENTI NECESSARI
  {
    id: 'dn-1',
    category: 'documenti',
    question: 'Quali documenti devo avere per fare la disdetta?',
    answer: 'Serve solo una bolletta recente (ultimi 3 mesi) del fornitore da cui vuoi recedere. La bolletta deve contenere il codice contratto (POD per luce, PDR per gas, numero cliente per telefonia) e i dati del fornitore. Il tuo documento d\'identità verrà allegato automaticamente dalla piattaforma.',
  },
  {
    id: 'dn-2',
    category: 'documenti',
    question: 'La bolletta deve essere originale o va bene una copia?',
    answer: 'Va benissimo una copia digitale della bolletta (PDF o foto). Non serve la bolletta cartacea originale. L\'importante è che sia leggibile e contenga tutti i dati del contratto chiaramente visibili.',
  },
  {
    id: 'dn-3',
    category: 'documenti',
    question: 'Devo caricare il documento d\'identità?',
    answer: 'Sì, il documento d\'identità è obbligatorio e viene richiesto una sola volta quando completi il profilo. Verrà automaticamente allegato a tutte le future disdette. Questo è un requisito legale per la validità della disdetta.',
  },
  {
    id: 'dn-4',
    category: 'documenti',
    question: 'Quali formati di file sono accettati?',
    answer: 'Accettiamo PDF, PNG, JPG e JPEG per le bollette e i documenti d\'identità. La dimensione massima per file è 10MB. Se hai un file troppo grande, puoi comprimerlo online prima del caricamento.',
  },
  {
    id: 'dn-5',
    category: 'documenti',
    question: 'Serve la lettera di delega?',
    answer: 'No, la lettera di delega viene generata automaticamente dal sistema quando confermi i dati. Non è necessario caricare alcun documento di delega manualmente - ci pensiamo noi a creare tutti i documenti necessari.',
  },

  // SICUREZZA E PRIVACY
  {
    id: 'sp-1',
    category: 'sicurezza',
    question: 'I miei dati sono al sicuro?',
    answer: 'Sì, utilizziamo crittografia SSL/TLS per tutte le comunicazioni e i dati sono archiviati in server sicuri conformi GDPR su Supabase. Non condividiamo mai i tuoi dati con terze parti senza il tuo consenso. Hai il diritto di richiedere la cancellazione completa dei tuoi dati in qualsiasi momento.',
  },
  {
    id: 'sp-2',
    category: 'sicurezza',
    question: 'Chi ha accesso ai miei documenti?',
    answer: 'Solo tu e il personale tecnico autorizzato (in caso di supporto) hanno accesso ai tuoi documenti. I documenti vengono utilizzati esclusivamente per generare la lettera di disdetta e vengono conservati secondo le normative GDPR con strict Row Level Security.',
  },
  {
    id: 'sp-3',
    category: 'sicurezza',
    question: 'Cosa succede ai miei dati dopo la disdetta?',
    answer: 'I dati vengono conservati per 12 mesi per finalità di supporto e conformità legale, dopodiché vengono automaticamente cancellati. Puoi richiedere la cancellazione anticipata in qualsiasi momento dalla pagina del profilo o contattando il supporto.',
  },
  {
    id: 'sp-4',
    category: 'sicurezza',
    question: 'Come proteggete i pagamenti?',
    answer: 'Non gestiamo direttamente i pagamenti: utilizziamo Stripe, lo standard industriale per i pagamenti online sicuri. I dati della tua carta non passano mai dai nostri server e non vengono memorizzati da noi.',
  },

  // SUPPORTO
  {
    id: 'su-1',
    category: 'supporto',
    question: 'Come posso contattare il supporto?',
    answer: 'Puoi contattarci via email a support@DisdEasy.it oppure tramite il form di contatto nella pagina Supporto. Il nostro team risponde entro 24 ore lavorative. Per problemi urgenti, specifica "URGENTE" nell\'oggetto.',
  },
  {
    id: 'su-2',
    category: 'supporto',
    question: 'Il supporto è gratuito?',
    answer: 'Sì, il supporto via email è completamente gratuito per tutti gli utenti. Rispondiamo a qualsiasi domanda tecnica, problema con la piattaforma, o dubbio sul processo di disdetta senza costi aggiuntivi.',
  },
  {
    id: 'su-3',
    category: 'supporto',
    question: 'Offrite assistenza telefonica?',
    answer: 'Attualmente offriamo supporto principalmente via email per garantire risposte accurate e tracciabili. Per casi particolarmente complessi, possiamo organizzare una chiamata su appuntamento. Contattaci via email per richiederla.',
  },
  {
    id: 'su-4',
    category: 'supporto',
    question: 'Quanto tempo ci vuole per ricevere una risposta?',
    answer: 'Il nostro team risponde generalmente entro 24 ore lavorative. Per problemi urgenti che bloccano l\'uso della piattaforma, diamo priorità e rispondiamo il prima possibile, spesso entro poche ore.',
  },
]
