import { Hono } from 'hono';

import { Home } from '@/modules/home';
import { Env } from '@/types';

const publicRouter = new Hono<{ Bindings: Env }>();

publicRouter.get('/', (c) => c.render(<Home />, { title: 'Home' }));

export { publicRouter };
