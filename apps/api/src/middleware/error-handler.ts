import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';
import { ApiError } from '../lib/errors.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: 'المسار غير موجود' } });
}

export function errorHandler(logger: Logger) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
      if (err.status >= 500) logger.error({ err }, 'api_error');
      return res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
        },
      });
    }

    logger.error({ err }, 'unhandled_error');
    res.status(500).json({
      error: { code: 'internal_error', message: 'حدث خطأ غير متوقع، حاول لاحقاً' },
    });
  };
}
