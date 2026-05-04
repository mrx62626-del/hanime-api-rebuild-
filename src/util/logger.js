// ─── Pino Logger ─────────────────────────────────────────────────────────────

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    base: { pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact sensitive fields if they ever appear in logs
    redact: ["req.headers.authorization", "req.headers.cookie"],
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize:        true,
          translateTime:   "SYS:HH:MM:ss",
          ignore:          "pid,hostname",
          messageFormat:   "{msg}",
        },
      })
    : undefined // In production write JSON to stdout
);

export default logger;
