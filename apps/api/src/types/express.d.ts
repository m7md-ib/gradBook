import type { JwtAccessPayload } from '@daftar/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
      csrfToken?: string;
    }
  }
}

export {};
