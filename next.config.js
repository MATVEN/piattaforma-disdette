// next.config.js

/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

// 1. Content Security Policy
// 'unsafe-eval' è necessario solo in sviluppo (Next.js source maps)
// In produzione viene rimosso per maggiore sicurezza
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ''} https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com;
  connect-src 'self'
    https://*.supabase.co
    wss://*.supabase.co
    https://api.stripe.com
    https://api.anthropic.com;
  frame-src https://js.stripe.com https://hooks.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`
const cspValue = ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()

// 2. Security Headers
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
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    key: 'Content-Security-Policy',
    value: cspValue
  },
]

// 3. Configurazione Next.js
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/aida-public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig