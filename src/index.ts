import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';

import { renderClient } from '@/renderClient';
import { apiRouter } from '@/routes/api';
import { publicRouter } from '@/routes/public';
import { Env } from '@/types';

const app = new Hono<{ Bindings: Env }>();

app.use(logger(), secureHeaders(), trimTrailingSlash());

app.route('/api', apiRouter);

app.get('*', renderClient);
app.route('/', publicRouter);

export default app;
