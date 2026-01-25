import { motion } from 'framer-motion'
import Image from 'next/image'
interface AuthHeaderProps {
  subtitle: string
  showTextLogo?: boolean
}
export const AuthHeader = ({ subtitle, showTextLogo = false }: AuthHeaderProps) => (
  <div className="text-center mb-8">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex justify-center mb-4"
    >
        {showTextLogo ? (
          // Fallback: testo gradiente
    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            DisdEasy
    </h1>
        ) : (
          // Logo PNG
    <Image
            src="/images/disdeasy-logo.png"
            alt="DisdEasy"
            width={200}
            height={60}
            priority
            className="h-14 w-auto"
          />
        )}
    </motion.div>
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