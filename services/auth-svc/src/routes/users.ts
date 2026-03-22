import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { users } from '@assessment/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@assessment/utils';

import type { Env, Variables } from '../types';
import { jwtAuth, adminAuth } from '../middleware/jwt';

export const userRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /users
 * List all users (Admin only).
 */
userRoutes.get('/', jwtAuth, adminAuth, async (c) => {
  const db = c.get('db');
  
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  return c.json(createSuccessResponse(allUsers));
});

/**
 * DELETE /users/:id
 * Delete a user (Admin only).
 */
userRoutes.delete('/:id', jwtAuth, adminAuth, async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');

  // Prevent deleting oneself
  const currentUserId = c.get('userId');
  if (id === currentUserId) {
    return c.json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Cannot delete your own account'), 400);
  }

  await db.delete(users).where(eq(users.id, id));

  return c.json(createSuccessResponse({ message: 'User deleted successfully' }));
});
