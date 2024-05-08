import { Hono } from 'hono';
import { reactRenderer } from '@hono/react-renderer';
import { Home } from './modules/home';

const isProd = process.env.IS_PROD === 'true';

const manifestPath = '../dist/manifest.json';
const cssFile = isProd
  ? (await import(manifestPath)).default['src/client.tsx']?.css?.at(0)
  : null;

const app = new Hono();

app.get(
  '*',
  reactRenderer(({ children, title }) => {
    return (
      <html lang='en'>
        <head>
          <meta charSet='UTF-8' />
          <meta
            name='viewport'
            content='width=device-width, initial-scale=1.0'
          />
          <link href='/static/css/reset.css' rel='stylesheet' />
          {cssFile && <link rel='stylesheet' href='${cssFile}' />}
          <title>{`${title} | Tycho Verstraete`}</title>
        </head>
        <body>
          {children}
          {!isProd && (
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
  })
);

app.get('/', (c) => {
  return c.render(<Home />, { title: 'Home' });
});

export default app;
