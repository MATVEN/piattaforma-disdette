export const TOOLTIP_CONTENT = {
  // B2C Fields
  codiceFiscale: 
    "Il tuo Codice Fiscale a 16 caratteri. Lo trovi sulla tessera sanitaria o documento d'identità.",
  
  indirizzo: 
    "L'indirizzo completo di residenza come indicato sui documenti ufficiali.",
  
  luogoNascita: 
    "Comune di nascita come riportato sul documento d'identità.",
  
  dataNascita: 
    "Data di nascita nel formato GG/MM/AAAA.",
  
  email: 
    "Email dove riceverai conferma dell'invio della disdetta.",
  
  telefono: 
    "Numero di telefono per eventuali comunicazioni urgenti.",

  // B2B Fields
  partitaIva: 
    "Partita IVA dell'azienda a 11 cifre. La trovi sulla visura camerale.",
  
  ragioneSociale: 
    "Denominazione ufficiale dell'azienda come registrata alla Camera di Commercio.",
  
  sedeLegale: 
    "Indirizzo della sede legale come indicato sulla visura camerale.",
  
  indirizzoFornitura:
    "L'indirizzo fisico dove si trova il contatore o la linea telefonica da disdire.",
  
  visuraCamerale: 
    "Documento recente (max 30 giorni) della Camera di Commercio che attesta l'esistenza dell'azienda e i poteri del Legale Rappresentante.",
  
  documentoLR: 
    "Documento d'identità valido del Legale Rappresentante (carta d'identità, patente o passaporto).",
  
  delegaFirmata: 
    "Delega scritta e firmata dal Legale Rappresentante che autorizza il delegato a richiedere la disdetta per conto dell'azienda.",
  
  ruoloRichiedente: 
    "Seleziona se sei il Legale Rappresentante dell'azienda oppure un delegato autorizzato.",

  // Common Fields - Supplier
  partitaIvaFornitore:
    "Partita IVA dell'azienda fornitrice del servizio a 11 cifre numeriche. La trovi sulla bolletta.",
  
  numeroContratto: 
    "Numero identificativo del tuo contratto. Per l'energia è il POD o PDR, per telefonia è il codice cliente.",
  
  iban: 
    "IBAN completo per l'eventuale rimborso del credito residuo. Formato italiano: IT seguito da 25 caratteri.",
  
  tipoContratto: 
    "Il tipo di utenza da disdire (Luce/Gas/Telefonia/Internet). Determina quale numero contratto ti verrà richiesto.",
  
  fornitore: 
    "Il nome dell'azienda che ti fornisce attualmente il servizio (es. Enel, Eni, TIM).",

  // Upload Areas
  uploadBolletta: 
    "Carica una copia recente della tua bolletta in formato PDF o immagine (JPG, PNG). Massimo 10MB.",
  
  uploadDocumento: 
    "Carica un documento d'identità valido in formato PDF o immagine. Fronte e retro se necessario.",
}

export const TOOLTIP_IDS = {
  codiceFiscale: 'tooltip-codice-fiscale',
  indirizzo: 'tooltip-indirizzo',
  luogoNascita: 'tooltip-luogo-nascita',
  dataNascita: 'tooltip-data-nascita',
  email: 'tooltip-email',
  telefono: 'tooltip-telefono',
  partitaIva: 'tooltip-partita-iva',
  ragioneSociale: 'tooltip-ragione-sociale',
  sedeLegale: 'tooltip-sede-legale',
  indirizzoFornitura: 'tooltip-indirizzo-fornitura',
  visuraCamerale: 'tooltip-visura-camerale',
  documentoLR: 'tooltip-documento-lr',
  delegaFirmata: 'tooltip-delega-firmata',
  ruoloRichiedente: 'tooltip-ruolo-richiedente',
  partitaIvaFornitore: 'tooltip-partita-iva-fornitore',
  numeroContratto: 'tooltip-numero-contratto',
  iban: 'tooltip-iban',
  tipoContratto: 'tooltip-tipo-contratto',
  fornitore: 'tooltip-fornitore',
  uploadBolletta: 'tooltip-upload-bolletta',
  uploadDocumento: 'tooltip-upload-documento',
} as const