import { motion } from 'framer-motion'
import { GoogleIcon } from './GoogleIcon'

interface OAuthButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

export const OAuthButton = ({ onClick, disabled, children }: OAuthButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    disabled={disabled}
    className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <GoogleIcon />
    {children}
  </motion.button>
)