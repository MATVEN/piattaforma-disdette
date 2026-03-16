import { motion } from 'framer-motion'
import Link from 'next/link'

export const LegalFooter = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
    className="mt-6 text-center text-sm text-gray-600 space-x-4"
  >
    <Link href="//privacy-cookie-policy" className="hover:text-gray-900 transition-colors">
      Privacy & Cookie
    </Link>
    <span>•</span>
    <Link href="/terms-of-service" className="hover:text-gray-900 transition-colors">
      Termini
    </Link>
    <span>•</span>
    <Link href="/consumer-protection" className="hover:text-gray-900 transition-colors">
      Tutela Consumatore
    </Link>
  </motion.div>
)