// next.config.js (Sintassi CommonJS corretta)

/** @type {import('next').NextConfig} */

// 1. Definizione degli Security Headers (invariati)
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
]

// 2. Configurazione di Next.js
const nextConfig = {
  // Aggiungi qui altre tue configurazioni se ne hai (es. 'reactStrictMode: true')
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  
  // 3. Applicazione degli headers
  async headers() {
    return [
      {
        // Applica questi header a tutte le rotte
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

// 4. Esporta la configurazione (Sintassi JS corretta)
module.exports = nextConfig