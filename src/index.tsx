import { Hono } from 'hono';
import { reactRenderer } from '@hono/react-renderer';
import { Home } from '@/modules/home';

const app = new Hono();

app.get(
  '*',
  reactRenderer(
    ({ children, title }) => {
      return (
        <html lang='en'>
          <head>
            <meta charSet='UTF-8' />
            <meta
              name='viewport'
              content='width=device-width, initial-scale=1.0'
            />
            {import.meta.env.PROD ? (
              <link rel='stylesheet' href='/static/assets/style.css' />
            ) : (
              <link rel='stylesheet' href='/src/style.css' />
            )}
            <title>{`${title} | Tycho Verstraete`}</title>
          </head>
          <body>{children}</body>
        </html>
      );
    },
    {
      docType: true,
    }
  )
);

app.get('/', (c) => {
  return c.render(<Home />, { title: 'Home' });
});

export default app;
