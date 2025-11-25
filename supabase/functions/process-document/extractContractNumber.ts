// supabase/functions/process-document/extractContractNumber.ts
// (C21 - Contract Number Extraction)

/**
 * Pattern regex per diversi tipi di contratti
 */
const CONTRACT_PATTERNS = {
  // POD (Punto di Prelievo - Luce)
  // Formato: IT + 3 cifre + E + 8-16 cifre
  POD: /IT\d{3}E\d{8,16}/gi,
  
  // PDR (Punto di Riconsegna - Gas)
  // Formato: 14 cifre consecutive
  PDR: /\b\d{14}\b/g,
  
  // Codice Cliente generico
  // Formato: lettere/numeri 8-20 caratteri
  CLIENT_CODE: /\b[A-Z0-9]{8,20}\b/g,
  
  // Codice Utenza (Telefonia/Internet)
  // Formato: numeri 10-15 cifre
  UTENZA: /\b\d{10,15}\b/g,
}

/**
 * Keywords che identificano un contract number nel contesto
 */
const CONTRACT_KEYWORDS = [
  'pod', 'pdr', 'codice cliente', 'numero cliente', 'codice utenza',
  'numero contratto', 'contratto n', 'utenza', 'fornitura',
  'punto di prelievo', 'punto di riconsegna', 'codice fornitura'
]

interface ExtractionResult {
  contractNumber: string | null
  confidence: 'high' | 'medium' | 'low'
  method: 'entity' | 'regex' | 'heuristic' | 'none'
  rawMatches?: string[]
}

/**
 * Strategy 1: Estrazione da entities Google AI
 */
function extractFromEntities(entities: any[]): ExtractionResult | null {
  if (!Array.isArray(entities)) return null

  // Cerca entity con type che contiene "contract", "pod", "pdr", "cliente"
  const contractEntity = entities.find((e: any) => {
    const type = (e?.type || '').toLowerCase()
    return (
      type.includes('contract') ||
      type.includes('pod') ||
      type.includes('pdr') ||
      type.includes('cliente') ||
      type.includes('utenza') ||
      type.includes('fornitura')
    )
  })

  if (contractEntity?.mentionText) {
    const text = String(contractEntity.mentionText).trim()
    if (text.length >= 8) { // Lunghezza minima ragionevole
      return {
        contractNumber: text,
        confidence: contractEntity.confidence > 0.8 ? 'high' : 'medium',
        method: 'entity'
      }
    }
  }

  return null
}

/**
 * Strategy 2: Regex pattern matching su testo grezzo
 */
function extractFromText(fullText: string): ExtractionResult | null {
  if (!fullText || fullText.length < 50) return null

  const matches: string[] = []
  
  // Test tutti i pattern
  // 1. POD (priorità alta - molto specifico)
  const podMatches = fullText.match(CONTRACT_PATTERNS.POD)
  if (podMatches && podMatches.length > 0) {
    return {
      contractNumber: podMatches[0],
      confidence: 'high',
      method: 'regex',
      rawMatches: podMatches
    }
  }

  // 2. PDR (alta priorità - 14 cifre specifiche)
  const pdrMatches = fullText.match(CONTRACT_PATTERNS.PDR)
  if (pdrMatches && pdrMatches.length > 0) {
    // Valida che sia vicino a keyword "PDR" per evitare falsi positivi
    for (const match of pdrMatches) {
      const index = fullText.indexOf(match)
      const context = fullText.slice(Math.max(0, index - 50), index + 50).toLowerCase()
      
      if (context.includes('pdr') || context.includes('gas')) {
        return {
          contractNumber: match,
          confidence: 'high',
          method: 'regex',
          rawMatches: pdrMatches
        }
      }
    }
    
    // Se non trova "PDR" nel contesto ma c'è solo un match, usalo comunque
    if (pdrMatches.length === 1) {
      return {
        contractNumber: pdrMatches[0],
        confidence: 'medium',
        method: 'regex',
        rawMatches: pdrMatches
      }
    }
  }

  // 3. Codice Cliente (priorità media - meno specifico)
  const clientMatches = fullText.match(CONTRACT_PATTERNS.CLIENT_CODE)
  if (clientMatches && clientMatches.length > 0) {
    // Cerca match vicino a keywords
    for (const match of clientMatches) {
      const index = fullText.indexOf(match)
      const context = fullText.slice(Math.max(0, index - 100), index + 50).toLowerCase()
      
      const hasKeyword = CONTRACT_KEYWORDS.some(kw => context.includes(kw))
      if (hasKeyword) {
        return {
          contractNumber: match,
          confidence: 'medium',
          method: 'regex',
          rawMatches: clientMatches.slice(0, 3) // Primi 3 match
        }
      }
    }
  }

  return null
}

/**
 * Strategy 3: Heuristic search basata su supplier
 */
function extractHeuristic(fullText: string, supplierTaxId?: string): ExtractionResult | null {
  if (!fullText) return null

  const textLower = fullText.toLowerCase()
  
  // Identifica operatore da tax_id o nome nel testo
  const isEnel = textLower.includes('enel') || supplierTaxId?.startsWith('06655971007')
  const isEni = textLower.includes('eni') || supplierTaxId?.startsWith('00905811006')
  const isFastweb = textLower.includes('fastweb') || supplierTaxId?.startsWith('12878470157')
  const isAcea = textLower.includes('acea') || supplierTaxId?.startsWith('05394801004')
  
  // ENEL: cerca POD o PDR
  if (isEnel) {
    const podMatch = fullText.match(CONTRACT_PATTERNS.POD)
    if (podMatch) {
      return {
        contractNumber: podMatch[0],
        confidence: 'high',
        method: 'heuristic',
        rawMatches: podMatch
      }
    }
    
    const pdrMatch = fullText.match(CONTRACT_PATTERNS.PDR)
    if (pdrMatch && pdrMatch.length === 1) {
      return {
        contractNumber: pdrMatch[0],
        confidence: 'medium',
        method: 'heuristic',
        rawMatches: pdrMatch
      }
    }
  }

  // ENI: cerca PDR o codice cliente
  if (isEni) {
    const pdrMatch = fullText.match(CONTRACT_PATTERNS.PDR)
    if (pdrMatch && pdrMatch.length === 1) {
      return {
        contractNumber: pdrMatch[0],
        confidence: 'medium',
        method: 'heuristic',
        rawMatches: pdrMatch
      }
    }
  }

  // FASTWEB: cerca codice utenza
  if (isFastweb) {
    const utenzaMatch = fullText.match(CONTRACT_PATTERNS.UTENZA)
    if (utenzaMatch && utenzaMatch.length > 0) {
      // Cerca il primo match vicino a "codice" o "utenza"
      for (const match of utenzaMatch) {
        const index = fullText.indexOf(match)
        const context = fullText.slice(Math.max(0, index - 50), index + 50).toLowerCase()
        if (context.includes('codice') || context.includes('utenza')) {
          return {
            contractNumber: match,
            confidence: 'medium',
            method: 'heuristic',
            rawMatches: [match]
          }
        }
      }
    }
  }

  return null
}

/**
 * Main extraction function - usa le 3 strategie in cascata
 */
export function extractContractNumber(
  ocrResponse: any,
  supplierTaxId?: string
): ExtractionResult {
  const document = ocrResponse?.document
  if (!document) {
    return {
      contractNumber: null,
      confidence: 'low',
      method: 'none'
    }
  }

  // Strategy 1: Entity extraction
  if (document.entities) {
    const entityResult = extractFromEntities(document.entities)
    if (entityResult) {
      console.log('[C21] Contract number trovato via entity extraction:', entityResult)
      return entityResult
    }
  }

  // Strategy 2: Regex on full text
  if (document.text) {
    const textResult = extractFromText(document.text)
    if (textResult) {
      console.log('[C21] Contract number trovato via regex:', textResult)
      return textResult
    }
  }

  // Strategy 3: Heuristic
  if (document.text) {
    const heuristicResult = extractHeuristic(document.text, supplierTaxId)
    if (heuristicResult) {
      console.log('[C21] Contract number trovato via heuristic:', heuristicResult)
      return heuristicResult
    }
  }

  // Nessun match trovato
  console.warn('[C21] Nessun contract number trovato nel documento')
  return {
    contractNumber: null,
    confidence: 'low',
    method: 'none'
  }
}