import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: process.env.PUBLIC_PORTAL_ORIGIN || 'https://pactsol.in', output:'static', outDir:'./dist-dual', integrations:[sitemap()] });
