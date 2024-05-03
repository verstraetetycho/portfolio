import { Hono } from 'hono';
import { reactRenderer } from '@hono/react-renderer';

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
          <link href='/static/css/master.css' rel='stylesheet' />
          <title>{`${title} | Tycho Verstraete`}</title>
        </head>
        <body>{children}</body>
      </html>
    );
  })
);

app.get('/', (c) => {
  return c.render(<h1>Welcome!</h1>, { title: 'Home' });
});

export default app;
