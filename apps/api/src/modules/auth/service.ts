import { eq } from 'drizzle-orm';
import type { LoginInput, SignupInput } from '@daftar/shared';
import { db } from '../../db/client.js';
import { users, refreshTokens } from '../../db/schema/index.js';
import { hashPassword, verifyPassword } from '../../auth/password.js';
import { generateRefreshToken, hashToken, refreshTokenTtlMs, signAccessToken } from '../../auth/jwt.js';
import { ApiError } from '../../lib/errors.js';
import type { User } from '../../db/schema/identity.js';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export async function signup(input: SignupInput): Promise<{ user: User; tokens: IssuedTokens }> {
  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) {
    throw ApiError.conflict('يوجد حساب مسجّل بهذا البريد الإلكتروني بالفعل');
  }

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      locale: input.locale,
      role: 'graduate',
    })
    .returning();

  if (!user) throw ApiError.internal();

  const tokens = await issueTokens(user);
  return { user, tokens };
}

export async function login(input: LoginInput): Promise<{ user: User; tokens: IssuedTokens }> {
  const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (!user) throw ApiError.unauthorized('البريد الإلكتروني أو كلمة المرور غير صحيحة');

  if (user.blockedAt) throw ApiError.forbidden('تم إيقاف هذا الحساب');

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('البريد الإلكتروني أو كلمة المرور غير صحيحة');

  const tokens = await issueTokens(user);
  return { user, tokens };
}

export async function issueTokens(user: User): Promise<IssuedTokens> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const { token: refreshToken, hash } = generateRefreshToken();

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + refreshTokenTtlMs()),
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(rawToken: string): Promise<{ user: User; tokens: IssuedTokens }> {
  const hash = hashToken(rawToken);
  const record = await db.query.refreshTokens.findFirst({ where: eq(refreshTokens.tokenHash, hash) });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw ApiError.unauthorized('انتهت الجلسة، سجّل الدخول مرة أخرى');
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, record.userId) });
  if (!user || user.blockedAt) throw ApiError.unauthorized();

  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, record.id));

  const tokens = await issueTokens(user);
  return { user, tokens };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const hash = hashToken(rawToken);
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hash));
}

export async function getUserById(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
