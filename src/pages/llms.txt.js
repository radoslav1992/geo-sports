import {llmsTxt} from '../lib/seo.js';
import {siteStats} from '../data/faq.js';
export const GET = () => new Response(llmsTxt(siteStats), {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
