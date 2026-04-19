import type { NextRequest } from 'next/server';

type LogLevel = 'info' | 'warn' | 'error';
type LogFields = Record<string, unknown>;

function writeStructuredLog(level: LogLevel, event: string, fields: LogFields = {}) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  if (level === 'warn') {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

function requestFields(req: NextRequest, startedAt: number) {
  return {
    method: req.method,
    route: req.nextUrl.pathname,
    durationMs: Date.now() - startedAt,
  };
}

function errorFields(error: unknown) {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }

  return {
    errorMessage: String(error),
  };
}

export function logApiInfo(event: string, req: NextRequest, startedAt: number, fields: LogFields = {}) {
  writeStructuredLog('info', event, {
    ...requestFields(req, startedAt),
    ...fields,
  });
}

export function logApiWarn(event: string, req: NextRequest, startedAt: number, fields: LogFields = {}) {
  writeStructuredLog('warn', event, {
    ...requestFields(req, startedAt),
    ...fields,
  });
}

export function logApiError(event: string, req: NextRequest, startedAt: number, error: unknown, fields: LogFields = {}) {
  writeStructuredLog('error', event, {
    ...requestFields(req, startedAt),
    ...fields,
    ...errorFields(error),
  });
}
