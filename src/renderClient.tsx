import { reactRenderer } from '@hono/react-renderer';

const renderClient = reactRenderer(
  ({ children, title }) => (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {import.meta.env.PROD ? (
          <link rel='stylesheet' href='/static/assets/style.css' />
        ) : (
          <link rel='stylesheet' href='/src/style.css' />
        )}
        <title>{`${title} | Tycho Verstraete`}</title>
      </head>
      <body>{children}</body>
    </html>
  ),
  {
    docType: true,
  }
);

export { renderClient };
