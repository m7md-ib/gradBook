import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import type { Logger } from 'pino';
import { env } from '../config/env.js';
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

    // multer throws its own error class (not ApiError) when a file fails its
    // upload middleware checks — a too-large photo was previously reported
    // to the user as a generic 500 instead of a clear 400.
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `حجم الملف أكبر من الحد المسموح (${env.STORAGE_MAX_UPLOAD_MB} ميجابايت)`
          : 'تعذّر رفع الملف، تأكد من نوع وحجم الصورة';
      return res.status(400).json({ error: { code: 'upload_error', message } });
    }

    logger.error({ err }, 'unhandled_error');
    res.status(500).json({
      error: { code: 'internal_error', message: 'حدث خطأ غير متوقع، حاول لاحقاً' },
    });
  };
}
