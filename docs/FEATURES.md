# 📋 ELENCO PROSSIME FEATURE

## 🎯 PANORAMICA

Dopo il completamento di C17 (Design System), ecco TUTTE le feature identificate per lo sviluppo futuro, ordinate per priorità e divise tra:
- ✅ **Implementabili GRATIS in ambiente TEST**
- 💰 **Richiedono COSTI o lancio reale**

---

## 🆓 FEATURE GRATUITE (Test Environment)

---

### **C18 - Error Pages Branded** ⚡✅
**Effort:** 0.5 giorni  
**Priorità:** BASSA (Polish)

**Cosa fa:**  
Pagine 404 (non trovato) e 500 (errore server) personalizzate con design coerente invece della schermata bianca standard.

**Perché è importante:**  
Anche gli errori devono essere curati. Migliora l'immagine professionale del brand.

**Esempio pratico:**  
Utente va su pagina inesistente → Invece di "404 Not Found" vede pagina con design moderno, messaggio friendly e link utili.

---

### **C19 - Legal Pages & Footer** ⚡
**Effort:** 1-2 giorni  
**Priorità:** ALTA (Compliance GDPR)

**Cosa fa:**  
Crea le pagine legali obbligatorie per legge: Privacy Policy, Termini di Servizio, Cookie Policy. Aggiunge un footer professionale con questi link, contatti e social.

**Perché è importante:**  
Obbligo legale (GDPR). Senza queste pagine, la piattaforma non è a norma e non può operare legalmente in Italia/UE.

**Esempio pratico:**  
Ogni utente può vedere come vengono usati i suoi dati, quali sono i suoi diritti, e le regole del servizio.

---

### **C20 - Duplicate Detection** ⚡
**Effort:** 1 giorno  
**Priorità:** ALTA (Prevenzione errori)

**Cosa fa:**  
Impedisce agli utenti di inviare disdette duplicate per lo stesso contratto. Se provi a creare una seconda disdetta per un contratto già disdetto, il sistema mostra un avviso e blocca.

**Perché è importante:**  
Previene confusione con i provider, spreco di risorse, e possibili problemi legali con invii multipli.

**Esempio pratico:**  
Utente carica bolletta Enel già disdetta → Sistema: "Attenzione! Hai già una disdetta in corso per questo contratto del 15/11/2024"

---

### **C21 - Testing & QA Suite** 🧪
**Effort:** 3-4 giorni  
**Priorità:** ALTA (Qualità)

**Cosa fa:**  
Crea test automatici che verificano continuamente che tutto funzioni. Come avere un QA tester robot che controlla login, upload, OCR, invio PEC automaticamente ogni volta che modifichi il codice.

**Perché è importante:**  
Riduce drasticamente i bug, accelera lo sviluppo futuro, garantisce che nuove feature non rompano quelle esistenti.

**Esempio pratico:**  
Modifichi qualcosa nel codice → Test automatico controlla che login funzioni ancora → Ti avvisa se hai rotto qualcosa

---

### **C22 - UI Polish (Altre Pagine)** ✨
**Effort:** 2-3 giorni  
**Priorità:** MEDIA-ALTA (Coerenza brand)

**Cosa fa:**  
Applica il design moderno di C17 alle pagine che ancora non lo hanno: login, registrazione, profilo utente, wizard creazione disdetta. Rende tutta la piattaforma visivamente coerente.

**Perché è importante:**  
Brand consistency, professionalità percepita. Attualmente alcune pagine sono moderne (dashboard) e altre vecchie (login).

**Esempio pratico:**  
Login page passa da semplice form bianco a design moderno con gradienti, animazioni, e stile glassmorphism come la dashboard.

---

### **C23 - PDF Generator & B2B Support** 🔴 CRITICO
**Effort:** 3-4 giorni  
**Priorità:** MASSIMA

**Cosa fa:**  
Sistema completo di generazione PDF per lettere di disdetta con supporto sia B2C (privati) che B2B (aziende/P.IVA). Il sistema genera un PDF standard della piattaforma (legalmente valido senza bisogno di moduli provider-specific) compilato automaticamente con i dati estratti dalla bolletta. Per le aziende, gestisce anche documenti obbligatori come Visura Camerale e deleghe. Include form condizionale che mostra campi diversi per privati (Nome, Cognome, CF) vs aziende (Ragione Sociale, P.IVA, Legale Rappresentante).

**Perché è importante:**  
Senza questa feature, il sistema supporterebbe solo privati perdendo tutto il mercato B2B. I provider aziendali rifiuterebbero le disdette senza Visura Camerale (prova dei poteri di firma) e delega se necessaria. È il gap più critico per validità legale e per aprire il mercato aziendale. La scoperta chiave: ricerca legale ha confermato che NON servono moduli provider-specific, basta un template standard con tutti i campi obbligatori - questo riduce effort da 4-6 giorni a 3-4 includendo tutto il B2B.

**Esempio pratico B2C:**  
Mario Rossi (privato) vuole disdire Enel → Compila form con nome, CF, indirizzo → Upload documento identità → Sistema genera PDF standard con tutti i dati → Pronto per invio PEC

**Esempio pratico B2B:**  
Rossi SRL (azienda) vuole disdire ENI → Compila form con Ragione Sociale, P.IVA, dati Legale Rappresentante → Upload Visura Camerale + documento LR (+ eventuale delega se richiedente ≠ LR) → Sistema genera PDF B2B con sezione azienda completa → Include Visura negli allegati → Pronto per invio PEC

---

### **C24 - User Onboarding** ✨
**Effort:** 2-3 giorni  
**Priorità:** MEDIA (UX)

**Cosa fa:**  
Guida interattiva per nuovi utenti. Al primo accesso: welcome message, tooltip che spiegano ogni passaggio, indicatore "Sei al passo 2 di 5", bottone "Hai bisogno di aiuto?" sempre visibile.

**Perché è importante:**  
Riduce abbandoni nel primo utilizzo. Gli utenti capiscono subito come funziona senza doverlo scoprire da soli.

**Esempio pratico:**  
Nuovo utente → Popup: "Benvenuto! Ti guidiamo passo-passo nella tua prima disdetta" → Frecce e tooltip su ogni campo del form

---

### **C25 - Status Tracking Avanzato** ✨
**Effort:** 2 giorni  
**Priorità:** MEDIA (Trasparenza)

**Cosa fa:**  
Timeline visuale dettagliata dello stato di ogni disdetta. Invece di vedere solo "In elaborazione", vedi: Caricata → OCR in corso (5 min fa) → Pronta per revisione (ora) → Confermata → PEC inviata.

**Perché è importante:**  
Trasparenza totale. L'utente sa sempre esattamente a che punto è la sua pratica, riduce ansia e richieste di supporto.

**Esempio pratico:**  
Dashboard mostra linea temporale grafica con pallini colorati per ogni fase + orario esatto di ogni passaggio.

---

### **C26 - FAQ & Help Center** ⚡
**Effort:** 1-2 giorni  
**Priorità:** MEDIA (Riduzione supporto)

**Cosa fa:**  
Sezione del sito con domande frequenti organizzate per categoria: Come funziona, Problemi comuni, Tempi, Costi, ecc. Con ricerca integrata.

**Perché è importante:**  
Riduce email/chiamate di supporto. Il 70-80% delle domande sono sempre le stesse, meglio rispondere una volta per tutte.

**Esempio pratico:**  
Utente ha dubbio → Va su FAQ → Cerca "quanto tempo" → Trova "Le disdette vengono elaborate in 24-48 ore"

---

### **C27 - Service Templates** 🎯⏸️🔄
**Effort:** 2-3 giorni  
**Priorità:** MEDIA (UX fluida)

**Cosa fa:**  
Database di template pre-compilati per ogni operatore. Enel ha sempre bisogno di codice POD, ENI di matricola, ecc. Il form si adatta automaticamente mostrando solo i campi necessari per quel provider.

**Perché è importante:**  
Riduce errori, velocizza compilazione. Ogni operatore ha campi diversi, meglio mostrare solo quelli giusti.

**Esempio pratico:**  
Selezioni Enel → Form mostra: Nome, Codice POD (obbligatorio), Indirizzo fornitura. Selezioni ENI → Form diverso con campi ENI.

---

### **C28 - Data Export & Privacy** ⚡
**Effort:** 1 giorno  
**Priorità:** MEDIA (GDPR Compliance)

**Cosa fa:**  
Due nuovi bottoni nel profilo: "Scarica i miei dati" (genera file con tutti i tuoi dati) e "Elimina il mio account" (cancellazione permanente).

**Perché è importante:**  
Diritto all'oblio (GDPR). Gli utenti devono poter scaricare ed eliminare i propri dati quando vogliono.

**Esempio pratico:**  
Utente clicca "Scarica dati" → Riceve ZIP con profilo, lista disdette, copie documenti caricati in formato leggibile.

---

### **C29 - Advanced Form Validation** ✨⏸️🔄
**Effort:** 1-2 giorni  
**Priorità:** BASSA (Qualità dati)

**Cosa fa:**  
Validazione intelligente dei campi form: verifica Codice Fiscale con algoritmo, controlla IBAN formato italiano, suggerisce correzioni per errori di battitura.

**Perché è importante:**  
Meno errori = meno disdette che falliscono per dati sbagliati = meno lavoro di correzione.

**Esempio pratico:**  
Utente inserisce CF sbagliato → Messaggio in tempo reale: "Il codice fiscale non è valido, controlla l'ultima cifra"

---

### **C30 - Document Preview** ✨
**Effort:** 2 giorni  
**Priorità:** BASSA (UX)

**Cosa fa:**  
Visualizzazione documenti caricati direttamente nel browser: zoom, rotazione, download. Nella dashboard, click per vedere PDF senza scaricarli.

**Perché è importante:**  
L'utente può verificare immediatamente che il documento caricato sia corretto e leggibile.

**Esempio pratico:**  
Dopo upload bolletta → Preview automatico. Vedi subito se l'immagine è sfocata e puoi ricaricarla prima di procedere.

---

### **C31 - In-App Notifications** ✨
**Effort:** 2 giorni  
**Priorità:** BASSA (Engagement)

**Cosa fa:**  
Icona campanella in navbar con notifiche: "Disdetta pronta per revisione", "PEC inviata!", "Errore elaborazione". Dentro la piattaforma, non via email.

**Perché è importante:**  
Comunicazione real-time senza costi email. Mantiene utente informato anche se non apre email.

**Esempio pratico:**  
OCR finisce → Badge rosso su campanella → Click → "La tua disdetta Enel è pronta per la revisione!"

---

### **C32 - Activity Log** ✨
**Effort:** 1-2 giorni  
**Priorità:** BASSA (Sicurezza)

**Cosa fa:**  
Cronologia completa attività utente visibile nel profilo: login, logout, disdette create, modifiche profilo, con data/ora.

**Perché è importante:**  
Trasparenza e sicurezza. L'utente può vedere accessi sospetti o verificare quando ha fatto cosa.

**Esempio pratico:**  
Profilo → Tab "Cronologia" → "Login da Milano il 15/11 ore 10:30", "Disdetta Enel creata il 16/11 ore 14:22"

---

### **C33 - Wizard Save & Resume** 🎯
**Effort:** 2-3 giorni  
**Priorità:** BASSA (Prevenzione frustrazione)

**Cosa fa:**  
Salvataggio automatico ogni 30 secondi mentre compili la disdetta. Se chiudi per errore, al ritorno chiede: "Vuoi continuare dove avevi lasciato?"

**Perché è importante:**  
Previene perdita dati per chiusura accidentale, crash browser, interruzioni. Riduce frustrazione utente.

**Esempio pratico:**  
Compili disdetta a metà → Browser crasha → Riapri → "Hai una bozza salvata 5 minuti fa, vuoi continuare?"

---

### **C34 - E2E Testing Suite** 🧪
**Effort:** 3-4 ore  
**Priorità:** ALTA (Qualità)

**Cosa fa:**  
Implementa una suite completa di test end-to-end con Playwright che valida tutti i flussi critici dell’applicazione: registrazione, upload bolletta, revisione dati, conferma, invio in modalità test, salvataggio e ripresa del wizard, rilevamento duplicati e interazioni della dashboard (scroll infinito, stati, errori).

**Perché è importante:**  
Assicura che l’intero percorso utente funzioni correttamente da inizio a fine. È un passaggio obbligatorio prima della PEC reale (C36), poiché l’invio PEC è irreversibile e può essere attivato solo quando tutti i flussi fondamentali sono certificati tramite test E2E affidabili.

**Quando farlo:**  
Subito dopo il completamento di C34 (Wizard Save & Resume) e prima di qualunque feature di produzione. In questo modo si garantisce la stabilità end-to-end della piattaforma prima del lancio.

**Esempio pratico:**  
L’utente crea un account → carica la bolletta → attende l’OCR → rivede i dati → conferma → invia in modalità test → torna in dashboard e visualizza lo stato aggiornato, con test che verificano ogni passaggio.

---

## 💰 FEATURE CON COSTI (Post-Test / Lancio Reale)

Queste feature richiedono servizi a pagamento o hanno senso solo con il servizio reale attivo.

---

### **C35 - PEC Real Send** 🔴 CRITICO (Post-Test)
**Effort:** 0.5-1 giorno  
**Costo:** Casella PEC certificata (~€50-100/anno) + SMTP

**Cosa fa:**  
Attiva l'invio PEC reale invece della modalità test. Rimuove i commenti nel codice e configura le credenziali SMTP del provider PEC.

**Perché è importante:**  
Senza questo, nessuna PEC viene realmente inviata. È necessario per il servizio reale ma NON per testare il resto della piattaforma.

**Quando farlo:**  
Quando sei pronto a mandare PEC vere ai provider. Fino ad allora, test mode simula tutto.

---

### **C36 - Email Notifications** 🔴 CRITICO (Post-Test)
**Effort:** 2-3 giorni  
**Costo:** Resend/SendGrid (gratis fino a ~10k email/mese, poi a pagamento)

**Cosa fa:**  
Invia email automatiche agli utenti: conferma registrazione, "disdetta in elaborazione", "PEC inviata con successo", "errore nella pratica".

**Perché è importante:**  
Comunicazione professionale via email. Attualmente solo toast in-app, ma le email sono più affidabili per comunicazioni importanti.

**Quando farlo:**  
Pre-launch o subito dopo, quando hai utenti reali. In test, le notifiche in-app (C32) sono sufficienti.

---

### **C37 - Payment Integration** 🔴 CRITICO (Monetizzazione)
**Effort:** 5-6 giorni  
**Costo:** Stripe (commissione ~2% + €0.25 per transazione)

**Cosa fa:**  
Integra pagamenti con carta di credito/debito. Crea pagina checkout, gestisce pagamenti, genera ricevute. Protegge la review page fino a pagamento completato.

**Perché è importante:**  
Senza questo, non puoi monetizzare. Ma per testare il servizio non serve.

**Quando farlo:**  
Quando decidi il pricing e sei pronto a monetizzare. Prima testa tutto gratis con utenti beta.

---

### **C38 - Guest Checkout Flow** 🎯 (Post-Payment)
**Effort:** 5-6 giorni  
**Costo:** Nessuno diretto, ma richiede C37 (Payment)

**Cosa fa:**  
Permette di creare disdette senza registrazione obbligatoria. L'utente paga come ospite, poi può eventualmente registrarsi per salvare la pratica nel profilo.

**Perché è importante:**  
Riduce friction, aumenta conversioni. Ma ha senso solo DOPO aver implementato pagamenti (C37).

**Quando farlo:**  
Dopo C37, quando vedi che molti utenti abbandonano alla registrazione.

---

### **C39 - Admin Dashboard** 🎯 (Post-Launch)
**Effort:** 6-8 giorni  
**Costo:** Nessuno diretto

**Cosa fa:**  
Pannello amministratore per gestire tutte le disdette, utenti, vedere analytics, cambiare manualmente status, aggiungere note interne.

**Perché è importante:**  
Gestione operativa. Ma ha senso solo con volume di utenti reali, non in test.

**Quando farlo:**  
Dopo lancio, quando hai traffico reale e serve supporto operativo avanzato.

---

### **C40 - Analytics & Tracking** ✨ (Pre-Launch)
**Effort:** 1-2 giorni  
**Costo:** Google Analytics 4 (gratis), Sentry per errors (gratis fino a soglia)

**Cosa fa:**  
Integra Google Analytics per tracciare: visite, registrazioni, disdette create, conversion rate, pagine più visitate. Setup Sentry per monitoraggio errori real-time.

**Perché è importante:**  
Dati per capire cosa funziona e cosa no. Ma inutile in test senza traffico reale.

**Quando farlo:**  
1-2 settimane prima del lancio, così hai dati dal giorno 1.

---

### **C41 - Performance Optimization** ✨ (Pre-Launch)
**Effort:** 2-3 giorni  
**Costo:** Nessuno diretto

**Cosa fa:**  
Analisi e ottimizzazione: bundle size, immagini, query database, cache, code splitting. Target: Lighthouse score 90+, caricamento <2 secondi.

**Perché è importante:**  
SEO e UX. Ma ha senso ottimizzare con traffico reale per capire i veri bottleneck.

**Quando farlo:**  
1-2 settimane prima del lancio, dopo aver completato tutte le feature.

---

## 📊 RIEPILOGO COMPLETO

### **Feature Gratuite (Test Environment)**
```
🔴 PRIORITÀ MASSIMA (Settimana 1-2):
- C18: PDF Template System (4-6d) ⚡⚡⚡
- C19: Legal Pages (1-2d)
- C20: Testing Suite (3-4d)
- C21: Duplicate Detection (1d)

✨ PRIORITÀ ALTA (Settimana 3-4):
- C22: UI Polish (2-3d)
- C23: User Onboarding (2-3d)
- C24: Status Tracking (2d)
- C25: Search & Filters (2d)
- C26: FAQ & Help (1-2d)

🎨 PRIORITÀ MEDIA-BASSA (Settimana 5+):
- C27: Service Templates (2-3d)
- C28: Data Export (1d)
- C29: Error Pages (0.5d)
- C30: Advanced Validation (1-2d)
- C31: Document Preview (2d)
- C32: In-App Notifications (2d)
- C33: Activity Log (1-2d)
- C34: Wizard Save (2-3d)
```

**Totale Feature Gratuite:** ~28-37 giorni (6-8 settimane)

---

### **Feature con Costi (Post-Test)**
```
🔴 CRITICHE per Lancio:
- C35: PEC Real Send (0.5-1d) 💰 ~€100/anno
- C36: Email Notifications (2-3d) 💰 Gratis poi €
- C37: Payment Integration (5-6d) 💰 ~2% commissioni

🎯 STRATEGIC (Post-Launch):
- C38: Guest Checkout (5-6d) - Richiede C37
- C39: Admin Dashboard (6-8d)

✨ PRE-LAUNCH:
- C40: Analytics (1-2d) - Gratis
- C41: Performance (2-3d) - Gratis
```

**Totale Feature Costi:** ~20-27 giorni + costi servizi

---

## 🎯 PERCORSI CONSIGLIATI

### **Percorso A: FAST TEST (3 settimane)**
```
Week 1-2: C18 + C19 + C21
Week 3:   C22 + C23
```
**Focus:** Solo essenziali + template critici  
**Risultato:** Servizio testabile con moduli corretti

---

### **Percorso B: QUALITY TEST (5-6 settimane)**
```
Week 1-2: C18 + C19 + C20 + C21
Week 3-4: C22 + C23 + C24 + C25 + C26
Week 5-6: C27 + C28 + Testing finale
```
**Focus:** Feature complete per test beta  
**Risultato:** Piattaforma professionale pronta per beta testers

---

### **Percorso C: COMPLETE (8 settimane)**
```
Week 1-2: Priorità Massima (C18-C21)
Week 3-4: Priorità Alta (C22-C26)
Week 5-6: Priorità Media-Bassa (C27-C34)
Week 7:   C35-C37 (Lancio)
Week 8:   C40-C41 (Ottimizzazione)
```
**Focus:** Tutto + lancio  
**Risultato:** Servizio completo pronto per produzione

---

## 💡 RACCOMANDAZIONE FINALE

**Per Test Environment (prima del lancio reale):**

### **MINIMO ASSOLUTO (Must-Do):**
1. **C18** - PDF Template System 🔴 (CRITICO)
2. **C19** - Legal Pages 🔴 (GDPR obbligatorio)
3. **C21** - Duplicate Detection (Previene problemi)

**Totale:** ~6-9 giorni

Per testare il servizio core con moduli corretti e compliance legale.

---

### **CONSIGLIATO (Beta Quality):**
Aggiungi a Minimo:
4. **C20** - Testing Suite (Qualità)
5. **C22** - UI Polish (Professionalità)
6. **C23** - User Onboarding (Riduce abbandoni)

**Totale:** ~13-18 giorni (3-4 settimane)

Per una piattaforma solida per beta testers.