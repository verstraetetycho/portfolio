import { Hono } from 'hono';
import { reactRenderer } from '@hono/react-renderer';
import { Home } from './modules/home';

const app = new Hono();

app.get(
  '*',
  reactRenderer(
    ({ children, title, c }) => {
      return (
        <html lang='en'>
          <head>
            <meta charSet='UTF-8' />
            <meta
              name='viewport'
              content='width=device-width, initial-scale=1.0'
            />
            <link href='/static/css/reset.css' rel='stylesheet' />
            <link href='/static/css/index.css' rel='stylesheet' />
            <title>{`${title} | Tycho Verstraete`}</title>
          </head>
          <body>
            {children}
            {c.env.IS_PROD !== 'true' && (
              <>
                <script
                  type='module'
                  src='http://localhost:5173/@vite/client'
                ></script>
                <script
                  type='module'
                  src='http://localhost:5173/src/client.tsx'
                ></script>
              </>
            )}
          </body>
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
