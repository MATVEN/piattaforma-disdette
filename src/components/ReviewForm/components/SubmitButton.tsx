// components/SubmitButton.tsx
//
// Submit button with loading state for ReviewForm
// Shows "Operazione in corso..." when submitting

import { motion } from 'framer-motion'
import { Loader2, CheckCircle2 } from 'lucide-react'

export interface SubmitButtonProps {
  loading: boolean
  disabled: boolean
  currentStatus: string
}

export function SubmitButton({ loading, disabled, currentStatus }: SubmitButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="submit"
      disabled={disabled || loading || currentStatus !== 'SUCCESS'}
      className="w-full rounded-xl bg-gradient-primary px-6 py-4 font-semibold text-white shadow-glass transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Operazione in corso...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-5 w-5" />
          <span>Conferma e Invia PEC</span>
        </>
      )}
    </motion.button>
  )
}
