const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 }

const currentLevel =
  LEVELS[import.meta.env.VITE_LOG_LEVEL?.toLowerCase()] ?? LEVELS.debug

function formatPrefix(level, context) {
  const ts = new Date().toISOString()
  return `[${ts}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''}`
}

function createMethod(level, consoleFn) {
  return (msg, context, data) => {
    if (LEVELS[level] < currentLevel) return
    const prefix = formatPrefix(level, context)
    if (data !== undefined) {
      consoleFn(prefix, msg, data)
    } else {
      consoleFn(prefix, msg)
    }
  }
}

const logger = {
  debug: createMethod('debug', console.debug),
  info: createMethod('info', console.info),
  warn: createMethod('warn', console.warn),
  error: createMethod('error', console.error),
}

export default logger
