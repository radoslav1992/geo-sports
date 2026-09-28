import {robotsTxt} from '../lib/seo.js';
export const GET = () => new Response(robotsTxt(), {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
