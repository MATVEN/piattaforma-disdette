import { motion } from 'framer-motion'

interface AuthHeaderProps {
  title: string
  subtitle: string
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => (
  <div className="text-center mb-8">
    <motion.h1
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2"
    >
      DisdettaFacile
    </motion.h1>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-gray-600 text-lg"
    >
      {subtitle}
    </motion.p>
  </div>
)