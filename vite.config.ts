import path from 'path';
import build from '@hono/vite-cloudflare-pages';
import adapter from '@hono/vite-dev-server/cloudflare';
import devServer from '@hono/vite-dev-server';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const globalConfig = {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };

  if (mode === 'client') {
    return {
      ...globalConfig,
      build: {
        rollupOptions: {
          input: ['./src/style.css'],
          output: {
            assetFileNames: 'static/assets/[name].[ext]',
          },
        },
      },
    };
  } else {
    return {
      ...globalConfig,
      ssr: {
        external: ['react', 'react-dom'],
      },
      plugins: [
        build(),
        devServer({
          adapter,
          entry: 'src/index.tsx',
        }),
      ],
    };
  }
});
