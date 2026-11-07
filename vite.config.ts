import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from "@cloudflare/vite-plugin";
import { existsSync } from 'node:fs';
import path from 'node:path';

// The AWS SDK picks its Node files on the server, which break in workerd
// (Node streams where fetch streams are expected). Its packages map each one
// to a `.browser.js` sibling via the "browser" field, which Vite's SSR build
// ignores; follow that mapping here. Needed both in the normal pipeline and in
// dev dependency prebundling.
const awsSdkBrowserRuntime = {
  name: 'aws-sdk-browser-runtime',
  enforce: 'pre' as const,
  resolveId(source: string, importer?: string) {
    if (!importer || !source.startsWith('.') || !/[\\/]@(aws-sdk|smithy)[\\/]/.test(importer)) return;
    const browser = path.resolve(path.dirname(importer), `${source.replace(/\.js$/, '')}.browser.js`);
    // A browser file may re-export its own Node base; never point it at itself.
    if (browser !== importer && existsSync(browser)) return browser;
  },
};

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  environments: {
    ssr: { optimizeDeps: { rolldownOptions: { plugins: [awsSdkBrowserRuntime] } } },
  },
  plugins: [
    awsSdkBrowserRuntime,
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // The Workers runtime isn't needed for unit tests (and breaks vitest).
    !process.env.VITEST && cloudflare({viteEnvironment: {name: 'ssr'}})
  ],
})

export default config
