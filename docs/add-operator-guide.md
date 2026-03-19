# Guida: Aggiungere Nuovi Operatori

## 🎯 Workflow Completo

### Step 1: Inserisci Operatore

```sql
INSERT INTO operators (name, pec_email, display_order)
VALUES ('Nome Operatore', 'email@pec.operatore.it', 999)
RETURNING id;
```

**Copia l'ID restituito** (es: 27)

-----

### Step 2: Associa a Categorie

**Categorie disponibili:**

- `1` = Mobile
- `2` = Internet
- `3` = Energia

```sql
-- Singola categoria
INSERT INTO operator_categories (operator_id, category_id)
VALUES (27, 2);  -- Internet

-- Più categorie
INSERT INTO operator_categories (operator_id, category_id)
VALUES 
 (27, 1),  -- Mobile
 (27, 2);  -- Internet
```

-----

### Step 3: Verifica

```sql
SELECT 
 o.name AS operatore,
 c.name AS categoria,
 o.pec_email
FROM operators o
JOIN operator_categories oc ON o.id = oc.operator_id
JOIN categories c ON oc.category_id = c.id
WHERE o.name = 'Nome Operatore';
```

-----

## 📋 Template Rapido

```sql
-- SOSTITUISCI: ___NOME___, ___EMAIL___, ___ID___, ___CATEGORIA___

-- 1. Inserisci
INSERT INTO operators (name, pec_email, display_order)
VALUES ('___NOME___', '___EMAIL___', 999) RETURNING id;

-- 2. Associa categorie
INSERT INTO operator_categories (operator_id, category_id)
VALUES (___ID___, ___CATEGORIA___);
```

-----

## 🔍 Query Utili

### Aggiungi nuove categorie

```sql
INSERT INTO categories (name) VALUES
 ('___NOME_CATEGORIA___')
RETURNING id, name;
```

### Lista tutti operatori

```sql
SELECT 
 o.id,
 o.name,
 o.pec_email,
 STRING_AGG(c.name, ', ') AS categorie
FROM operators o
LEFT JOIN operator_categories oc ON o.id = oc.operator_id
LEFT JOIN categories c ON oc.category_id = c.id
GROUP BY o.id, o.name, o.pec_email
ORDER BY o.name;
```

### Operatori per categoria

```sql
-- Mobile
SELECT o.name, o.pec_email
FROM operators o
JOIN operator_categories oc ON o.id = oc.operator_id
WHERE oc.category_id = 1
ORDER BY o.name;

-- Internet
WHERE oc.category_id = 2

-- Energia
WHERE oc.category_id = 3
```

### Operatori senza email PEC

```sql
SELECT id, name, pec_email
FROM operators
WHERE pec_email IS NULL 
  OR pec_email = 'NOT_CONFIGURED_YET'
ORDER BY name;
```

-----

## ⚠️ Note Importanti

**Email PEC obbligatoria:**

- Senza PEC, invio disdetta fallirà
- Usa `NOT_CONFIGURED_YET` come placeholder temporaneo

**Many-to-many:**

- Un operatore può essere in più categorie (es: TIM in Mobile + Internet)
- Serve un record in `operator_categories` per ogni categoria

-----

## 📝 Esempi Pratici

### Esempio 1: Operatore Single Category

**Iliad (solo Mobile):**

```sql
-- 1. Insert
INSERT INTO operators (name, pec_email, display_order)
VALUES ('Iliad', 'iliaditaliaspa@legalmail.it', 999)
RETURNING id;  -- ID: 28

-- 2. Category
INSERT INTO operator_categories (operator_id, category_id)
VALUES (28, 1);  -- Mobile
```

### Esempio 2: Operatore Multi Category

**WindTre (Mobile + Internet):**

```sql
-- 1. Insert
INSERT INTO operators (name, pec_email, display_order)
VALUES ('WindTre', 'servizioclienti159@pec.windtre.it', 999)
RETURNING id;  -- ID: 29

-- 2. Categories (2)
INSERT INTO operator_categories (operator_id, category_id)
VALUES 
 (29, 1),  -- Mobile
 (29, 2);  -- Internet
```

### Esempio 3: Aggiornare Email PEC

```sql
UPDATE operators
SET pec_email = 'nuova@pec.operatore.it'
WHERE id = 28;
```

-----

## 🚀 Checklist Aggiunta Operatore

- [ ] Verificato nome operatore corretto
- [ ] Verificato email PEC corretta e funzionante
- [ ] Inserito operatore in `operators`
- [ ] Copiato ID operatore restituito
- [ ] Associato a categorie corrette in `operator_categories`
- [ ] Verificato query finale mostra tutto correttamente
- [ ] Testato su piattaforma: operatore appare nella categoria giusta
- [ ] Testato invio PEC simulato funziona

-----

## 🔧 Query di Manutenzione

```sql
-- Elimina prima lo storico stati (foreign key dependency)
DELETE FROM disdetta_status_history;
-- Elimina le disdette
DELETE FROM disdette;
-- Verifica eliminazione
SELECT COUNT(*) as remaining_disdette FROM disdette;
SELECT COUNT(*) as remaining_history FROM disdetta_status_history;

-- Verifica aggiornamento disdetta
SELECT id, supplier_name, status
FROM disdette
WHERE id = 153;

-- Aggiungi nuove categorie
INSERT INTO categories (name) VALUES
 ('Pay TV'),
 ('Palestra'),
 ('Assicurazioni')
RETURNING id, name;
```

-----

## ============================================
## TEMPLATE: Aggiungi Nuovo Operatore
## ============================================

```sql
-- 1️⃣ INSERISCI OPERATORE
INSERT INTO operators (name, pec_email)
VALUES ('Enel Energia', 'servizio.clienti.enelenergia@pec.enel.it')
RETURNING id;
-- ⬆️ Copia ID restituito

-- 2️⃣ ASSOCIA A CATEGORIE
-- Mobile (id: 1), Internet (id: 2), Energia (id: 3)
INSERT INTO operator_categories (operator_id, category_id)
VALUES
 (22, 3);
-- Ripeti per ogni categoria in cui l'operatore opera

-- 3️⃣ VERIFICA
SELECT
 o.name AS operatore,
 c.name AS categoria,
 o.pec_email
FROM operators o
JOIN operator_categories oc ON o.id = oc.operator_id
JOIN categories c ON oc.category_id = c.id
WHERE o.name = 'Enel Energia';

-- Verifica associazioni per categoria specifica (es. Pay TV id 4)
SELECT
 c.id AS category_id,
 c.name AS category_name,
 o.id AS operator_id,
 o.name AS operator_name
FROM categories c
LEFT JOIN operator_categories oc ON c.id = oc.category_id
LEFT JOIN operators o ON oc.operator_id = o.id
WHERE c.id IN (4, 5, 6)  -- Pay TV, Palestra, Assicurazioni
ORDER BY c.id, o.name;
```

**Fine Guida**