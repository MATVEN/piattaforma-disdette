-- Helper query per il processing manuale delle ricevute PEC
-- Quando arriva una ricevuta, estrai il Message-ID e usa questa query per trovare la disdetta

-- UTILIZZO:
-- 1. Apri la ricevuta PEC in arrivo su disdette@pec.disdeasy.it
-- 2. Cerca negli header: "In-Reply-To:" oppure "References:"
--    Il formato è: <disdetta-123-1710934500000@disdeasy.it>
-- 3. Copia il Message-ID (incluse le parentesi angolari < >)
-- 4. Incollalo al posto di <PASTE-MESSAGE-ID-HERE> qui sotto ed esegui

SELECT
  d.id,
  d.message_id,
  d.sent_at,
  d.delivered_at,
  d.status,
  d.delivery_status,
  u.email AS user_email,
  o.name  AS operator_name,
  c.name  AS category_name
FROM disdette d
JOIN auth.users  u ON d.user_id      = u.id
JOIN operators   o ON d.operator_id  = o.id
JOIN categories  c ON d.category_id  = c.id
WHERE d.message_id = '<PASTE-MESSAGE-ID-HERE>'
LIMIT 1;

-- Output atteso:
-- id              → es. 42
-- message_id      → <disdetta-42-1710934500000@disdeasy.it>
-- user_email      → mario@example.it
-- operator_name   → TIM
-- status          → SENT
-- delivery_status → sent

-- ─────────────────────────────────────────
-- AGGIORNA STATO MANUALMENTE
-- ─────────────────────────────────────────

-- Se la ricevuta conferma la CONSEGNA (tipo: Consegna):
/*
UPDATE disdette
SET
  delivery_status = 'delivered',
  delivered_at    = NOW()
WHERE message_id = '<PASTE-MESSAGE-ID-HERE>';
*/

-- Se la ricevuta segnala un BOUNCE / ERRORE (tipo: Errore):
/*
UPDATE disdette
SET
  delivery_status = 'bounced',
  status          = 'FAILED'
WHERE message_id = '<PASTE-MESSAGE-ID-HERE>';
*/

-- Ricevuta di ACCETTAZIONE (tipo: Accettazione): nessuna azione richiesta.
