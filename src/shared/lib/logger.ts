type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const log = (level: LogLevel, message: string, context?: LogContext) => {
  const base = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(context ? { ...base, ...context } : base));
};

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};

