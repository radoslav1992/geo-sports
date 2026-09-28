import { defineConfig } from 'astro/config';
import { SITE } from './src/lib/seo.js';
export default defineConfig({ output: 'static', site: SITE, trailingSlash: 'ignore' });
