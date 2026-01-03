# Test Fixtures

## Required Files

### test-bolletta.pdf

You need a PDF bill for testing. Two options:

**Option 1: Use real bill (recommended)**
- Copy an actual Italian utility bill
- Rename to `test-bolletta.pdf`
- Place in this directory

**Option 2: Create mock PDF**
Use any PDF creator to make a simple 1-page document with:

```
BOLLETTA ENERGETICA

Fornitore: ENEL ENERGIA SPA
Partita IVA: 06655971007

Cliente: Mario Rossi
Codice Fiscale: RSSMRA80A01H501U
Indirizzo: Via Roma 123, Milano MI

Codice POD: IT001E12345678

Totale: €120,50
```

## Test User

Create this user in Supabase for testing:
- Email: test-e2e@DisEasy.test
- Password: TestPassword123!
- Complete profile with all required fields
- Upload documento identita

## Notes

- test-bolletta.pdf is in .gitignore (privacy)
- Must be readable by Google Document AI
- Keep file size < 5MB
