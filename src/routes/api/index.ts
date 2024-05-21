import { Env, Hono } from 'hono';

const apiRouter = new Hono<{ Bindings: Env }>();

apiRouter.get('/health/ping', (c) => c.json({ pong: true }));

export { apiRouter };
