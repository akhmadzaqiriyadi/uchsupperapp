import { Elysia } from "elysia";

// Color codes for terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

// Method colors
const methodColors: Record<string, string> = {
  GET: colors.green,
  POST: colors.blue,
  PUT: colors.yellow,
  PATCH: colors.yellow,
  DELETE: colors.red,
  OPTIONS: colors.gray,
  HEAD: colors.gray,
};

// Status colors
function getStatusColor(status: number): string {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.white;
}

// Format duration
function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Get timestamp
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Logger middleware for Elysia
 * Logs all HTTP requests with method, path, status, and duration
 */
export const logger = new Elysia({ name: "logger" })
  .derive(({ request }) => {
    return {
      startTime: Date.now(),
      requestId: crypto.randomUUID().substring(0, 8),
    };
  })
  .onAfterHandle(({ request, set, startTime, requestId }) => {
    const duration = Date.now() - startTime;
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    const status = (set.status as number) || 200;

    const methodColor = methodColors[method] || colors.white;
    const statusColor = getStatusColor(status);

    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ` +
      `${colors.dim}${requestId}${colors.reset} ` +
      `${methodColor}${method.padEnd(7)}${colors.reset} ` +
      `${path} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${colors.dim}${formatDuration(duration)}${colors.reset}`
    );
  })
  .onError(({ request, error, set, startTime, requestId }) => {
    const duration = Date.now() - (startTime || Date.now());
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    const status = (set.status as number) || 500;

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ` +
      `${colors.dim}${requestId}${colors.reset} ` +
      `${colors.red}${method.padEnd(7)}${colors.reset} ` +
      `${path} ` +
      `${colors.red}${status}${colors.reset} ` +
      `${colors.dim}${formatDuration(duration)}${colors.reset} ` +
      `${colors.red}ERROR: ${errorMessage}${colors.reset}`
    );
  });

/**
 * Simple console logger with levels
 */
export const log = {
  info: (message: string, ...args: unknown[]) => {
    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.blue}INFO${colors.reset}  ${message}`,
      ...args
    );
  },
  
  warn: (message: string, ...args: unknown[]) => {
    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.yellow}WARN${colors.reset}  ${message}`,
      ...args
    );
  },
  
  error: (message: string, ...args: unknown[]) => {
    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.red}ERROR${colors.reset} ${message}`,
      ...args
    );
  },
  
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.magenta}DEBUG${colors.reset} ${message}`,
        ...args
      );
    }
  },
  
  success: (message: string, ...args: unknown[]) => {
    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}OK${colors.reset}    ${message}`,
      ...args
    );
  },
};
