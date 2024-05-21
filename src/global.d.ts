import {} from 'hono';

declare module '@hono/react-renderer' {
  interface Props {
    title: string;
  }
}
