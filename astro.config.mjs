import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://shealeslein.com',
  build: {
    format: 'directory'
  },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  },
  integrations: []
});