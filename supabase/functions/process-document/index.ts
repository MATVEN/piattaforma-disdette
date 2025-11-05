import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Funzione process-document (v4.1 + C5 + CORS Fix + Delega + Upsert) avviata!")

interface DocumentPayload {
  bucket: string
  path: string
  delegaPath: string | null | undefined
  body?: DocumentPayload
}
interface AiEntity {
  type: string | null | undefined
  mentionText: string | null | undefined
  confidence: number | null | undefined
}
interface GoogleServiceAccount {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
  universe_domain: string
}

// --- Funzioni Helper ---
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getGoogleAccessToken(serviceAccount: GoogleServiceAccount): Promise<string> {
  console.log("Richiesta Access Token a Google...")
  const scope = "https://www.googleapis.com/auth/cloud-platform"
  const key = await crypto.subtle.importKey("pkcs8", pemToBinary(serviceAccount.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["sign"]);
  const jwt = await create({ alg: "RS256", typ: "JWT", kid: serviceAccount.private_key_id }, { iss: serviceAccount.client_email, sub: serviceAccount.client_email, aud: serviceAccount.token_uri, scope: scope, iat: getNumericDate(0), exp: getNumericDate(3600), }, key);
  const response = await fetch(serviceAccount.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt, }), });
  if (!response.ok) { const errorBody = await response.text(); throw new Error(`Errore autenticazione Google: ${response.status} ${errorBody}`); }
  const data = await response.json();
  console.log("Access Token ottenuto con successo.");
  return data.access_token;
}

function pemToBinary(pem: string): ArrayBuffer {
  // ... (Logica di pemToBinary invariata) ...
  const base64 = pem.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const binaryDer = atob(base64);
  const buffer = new ArrayBuffer(binaryDer.length);
  const bufView = new Uint8Array(buffer);
  for (let i = 0; i < binaryDer.length; i++) { bufView[i] = binaryDer.charCodeAt(i); }
  return buffer;
}


// --- CORS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- SERVER PRINCIPALE ---
serve(async (req: Request) => {
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }
  if (req.method !== "POST") { 
    return new Response(JSON.stringify({ error: "Metodo non consentito" }), { 
      status: 405, 
      headers: corsHeaders
    }) 
  }

  try {
    const payload: DocumentPayload = await req.json()
    console.log("--- PAYLOAD RICEVUTO DALLA FUNZIONE ---")
    console.log(JSON.stringify(payload, null, 2))
    console.log("---------------------------------------")

    const data = payload.body || payload; // Se esiste payload.body, usa quello

    // Sicurezza: assicuriamoci che data.path esista
    if (!data.path) {
      throw new Error("Payload path (file bolletta) mancante.");
    }

    console.log("Payload path letto:", data.path)
    console.log("Payload delega letto:", data.delegaPath)

    // --- 1. ESTRAI I SEGRETI ---
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT")
    const processorName = Deno.env.get("GCP_PROCESSOR_NAME")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")
    if (!serviceAccountJson || !processorName || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Mancano uno o più segreti.")
    }
    const serviceAccount: GoogleServiceAccount = JSON.parse(serviceAccountJson)

    // --- 2. SCARICA IL FILE DA SUPABASE (CORRETTO) ---
    console.log("In attesa (7s) che lo storage processi il file...")
    await sleep(7000); 
    
    // MODIFICA: Usa 'data.path' e 'data.bucket' (con un fallback)
    const fileUrl = `${supabaseUrl}/storage/v1/object/${data.bucket || 'documenti_utente'}/${data.path}`
    
    const response = await fetch(fileUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${supabaseServiceKey}` } })
    if (!response.ok) { const errorBody = await response.text(); throw new Error(`Errore download file: ${response.status} ${errorBody}`) }
    const fileData = await response.blob()
    const mimeType = response.headers.get('Content-Type') || 'application/octet-stream'
    if (!fileData) { throw new Error("File non trovato o vuoto.") }
    const fileBytes = await fileData.arrayBuffer()
    const fileBase64 = encodeBase64(fileBytes)
    console.log("File convertito in Base64 (metodo robusto).")

    // --- 3. AUTENTICAZIONE GOOGLE ---
    const accessToken = await getGoogleAccessToken(serviceAccount)

    // --- 4. CHIAMA GOOGLE DOCUMENT AI ---
    const location = processorName.split('/')[3]
    const restUrl = `https://${location}-documentai.googleapis.com/v1/${processorName}:process`
    console.log(`Chiamata al processore AI (REST): ${restUrl}`)
    const aiResponse = await fetch(restUrl, { method: "POST", headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json", }, body: JSON.stringify({ rawDocument: { content: fileBase64, mimeType: mimeType, }, }), });
    if (!aiResponse.ok) { const errorBody = await aiResponse.text(); throw new Error(`Errore chiamata AI (REST): ${aiResponse.status} ${errorBody}`); }
    const result = await aiResponse.json()
    console.log("Chiamata AI completata con successo.")
    const { document } = result
    if (!document || !document.text) { throw new Error("L'AI non ha restituito alcun testo.") }

    // --- 5. LOGGA I RISULTATI ---
    console.log("--- TESTO ESTRATTO DALL'AI ---") 
    
    // --- 6. SALVATAGGIO DATI ESTRATTI (CORRETTO) ---
    console.log("C5: Inizio salvataggio dati (Upsert) nel database...");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // MODIFICA: Usa 'data.path'
    const userId = data.path.split('/')[0];
    if (!userId || userId.length < 36) { 
      // MODIFICA: Usa 'data.path'
      throw new Error(`C5: Impossibile estrarre lo userId dal path: ${data.path}`); 
    }

    const extractedDataMap = new Map<string, string>();
    if (document.entities && document.entities.length > 0) { 
      document.entities.forEach((entity: AiEntity) => { 
        if (entity.type && entity.mentionText) { 
          extractedDataMap.set(entity.type, entity.mentionText); 
        } 
      }); 
    }

    const dataToInsert = {
      user_id: userId,
      file_path: data.path, // Corretto: usa 'data'
      documento_delega_path: data.delegaPath || null, // Corretto: usa 'data'
      status: 'PENDING_REVIEW',
      supplier_tax_id: extractedDataMap.get('supplier_tax_id') || null,
      receiver_tax_id: extractedDataMap.get('receiver_tax_id') || null,
      supplier_iban: extractedDataMap.get('supplier_iban') || null,
      raw_json_response: result
    };

    // --- MODIFICA CHIAVE: Da .insert() a .upsert() ---
    const { error: upsertError } = await supabaseAdmin
      .from('extracted_data')
      .upsert(dataToInsert, {
        onConflict: 'file_path' // Se 'file_path' esiste già, aggiorna
      });

    if (upsertError) {
      throw new Error(`C5: Errore salvaggio DB (Upsert): ${upsertError.message}`);
    } else {
      console.log("C5: Dati salvati/aggiornati con successo in 'extracted_data'.");
    }
    // --- FINE MODIFICA ---

    // --- 7. RISPOSTA FINALE ---
    return new Response(JSON.stringify({ success: true, text: document.text, db_saved: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error: unknown) {
    let errorMessage = "Errore sconosciuto"
    if (error instanceof Error) { 
      errorMessage = error.message
    }
    console.error("Errore grave nella funzione:", errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})