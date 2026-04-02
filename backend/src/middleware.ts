import { createMiddleware } from 'hono/factory';
import { env } from 'hono/adapter';

export const authMiddleware = createMiddleware(async (c, next) => {
  const { AUTH_TOKEN } = env<{ AUTH_TOKEN: string }>(c);
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' }, 401);
  }
  
  const token = authHeader.slice(7);
  if (token !== AUTH_TOKEN) {
    return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401);
  }
  
  await next();
});
