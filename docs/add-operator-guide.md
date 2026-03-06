# Guida: Aggiungere Nuovi Operatori

## 🎯 Workflow Completo

### Step 1: Inserisci Operatore

```sql
INSERT INTO operators (name, pec_email, display_order)
VALUES ('Nome Operatore', 'email@pec.operatore.it', 999)
RETURNING id;
```

**Copia l’ID restituito** (es: 27)

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

### Step 3: Crea Service Types

```sql
INSERT INTO service_types (name, operator_id, category_id)
VALUES ('Nome Operatore', 27, 2);

-- Se l'operatore è in più categorie
INSERT INTO service_types (name, operator_id, category_id)
VALUES 
 ('Nome Operatore', 27, 1),  -- Mobile
 ('Nome Operatore', 27, 2);  -- Internet
```

-----

### Step 4: Verifica

```sql
SELECT 
 o.name AS operatore,
 c.name AS categoria,
 st.id AS service_type_id,
 o.pec_email
FROM operators o
JOIN operator_categories oc ON o.id = oc.operator_id
JOIN categories c ON oc.category_id = c.id
LEFT JOIN service_types st ON st.operator_id = o.id AND st.category_id = c.id
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

-- 3. Crea service_types
INSERT INTO service_types (name, operator_id, category_id)
VALUES ('___NOME___', ___ID___, ___CATEGORIA___);
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

**Nome service_type:**

- Di solito uguale al nome operatore
- Es: operatore “TIM” → service_type “TIM”

**Many-to-many:**

- Un operatore può essere in più categorie (es: TIM in Mobile + Internet)
- Serve un record in `operator_categories` per ogni categoria
- Serve un `service_type` per ogni combinazione operatore+categoria

-----

## 📝 Esempi Pratici

### Esempio 1: Operatore Single Category

**Iliad (solo Mobile):**

```sql
-- 1. Insert
INSERT INTO operators (name, pec_email, dispaly_order)
VALUES ('Iliad', 'iliaditaliaspa@legalmail.it', 999)
RETURNING id;  -- ID: 28

-- 2. Category
INSERT INTO operator_categories (operator_id, category_id)
VALUES (28, 1);  -- Mobile

-- 3. Service Type
INSERT INTO service_types (name, operator_id, category_id)
VALUES ('Iliad', 28, 1);
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

-- 3. Service Types (2)
INSERT INTO service_types (name, operator_id, category_id)
VALUES 
 ('WindTre', 29, 1),  -- Mobile
 ('WindTre', 29, 2);  -- Internet
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
- [ ] Creato `service_types` per ogni categoria
- [ ] Verificato query finale mostra tutto correttamente
- [ ] Testato su piattaforma: operatore appare nella categoria giusta
- [ ] Testato invio PEC simulato funziona

-----

**Fine Guida**