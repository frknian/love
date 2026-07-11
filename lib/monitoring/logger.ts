type LogContext = Record<string, string | number | boolean | null | undefined>;

function safeContext(context: LogContext) {
  return Object.fromEntries(
    Object.entries(context).filter(
      ([key, value]) =>
        !/(token|password|secret|authorization)/i.test(key) &&
        value !== undefined,
    ),
  );
}

export const logger = {
  error(message: string, context: LogContext = {}) {
    if (process.env.NODE_ENV !== "production")
      console.error(message, safeContext(context));
  },
  warn(message: string, context: LogContext = {}) {
    if (process.env.NODE_ENV !== "production")
      console.warn(message, safeContext(context));
  },
};
