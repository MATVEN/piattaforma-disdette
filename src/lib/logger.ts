// src/lib/logger.ts
//
// Structured logging utility for consistent logging across the application
// C23 Day 4 - Phase 3.1: Improved Logging

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    // Console output with color (for development)
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m', // green
      warn: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
    }

    const reset = '\x1b[0m'
    const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`

    // Format context for better readability
    const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : ''

    console.log(`${prefix} ${entry.timestamp} - ${message}${contextStr}`)

    // In production, could send to logging service (e.g., Sentry, LogRocket)
    // if (!this.isDevelopment && level === 'error') {
    //   sendToLoggingService(entry)
    // }
  }

  /**
   * Debug logs - only in development
   */
  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }

  /**
   * Info logs - general information
   */
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  /**
   * Warning logs - potential issues
   */
  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  /**
   * Error logs - critical issues
   */
  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context)
  }

  /**
   * Log timing of operations
   */
  time(label: string): () => void {
    const start = Date.now()
    return () => {
      const duration = Date.now() - start
      this.info(`⏱️ ${label}`, { duration: `${duration}ms` })
    }
  }
}

export const logger = new Logger()
