import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://pactsol.in',

  output: 'server',

  adapter: cloudflare(),

  integrations: [
    sitemap(),
  ],
});