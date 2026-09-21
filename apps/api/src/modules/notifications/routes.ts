import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { notifications } from '../../db/schema/index.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { validateParams } from '../../middleware/validate.js';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await db.query.notifications.findMany({
      where: eq(notifications.userId, req.user!.sub),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });
    res.json({ items, unreadCount: items.filter((n) => !n.readAt).length });
  }),
);

notificationsRouter.patch(
  '/:id/read',
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.user!.sub)))
      .returning();
    res.json({ notification: updated });
  }),
);
