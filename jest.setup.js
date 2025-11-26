import '@testing-library/jest-dom'

// Load environment variables from .env.local for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://rpavxsztftxviowkfqlc.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwYXZ4c3p0ZnR4dmlvd2tmcWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MzUwMTYsImV4cCI6MjA3NzExMTAxNn0.mQ3aAs0LVCOkixWVC9aOGZhLqu9fx4If0fJ-B1emhIE'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwYXZ4c3p0ZnR4dmlvd2tmcWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUzNTAxNiwiZXhwIjoyMDc3MTExMDE2fQ.o7vlOjuojN5qSBtbW4dP473_9qlNheWfTcMVEomAXjk'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
  useParams: jest.fn(() => ({})),
}))

// Mock Framer Motion (prevents animation issues in tests)
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    form: 'form',
    button: 'button',
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  Toaster: () => null,
}))
