import {readState,initializeState} from './d1-state.mjs';
async function hash(text) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))), x=>x.toString(16).padStart(2,'0')).join(''); }
export default {async fetch(request,env) {
 if (!env.MIGRATION_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.MIGRATION_TOKEN}`) return new Response('Unauthorized',{status:401});
 try {
  if (request.method==='POST') {
   const raw=await request.text(); if (raw.length>8000000) return new Response('Too large',{status:413});
   const data=JSON.parse(raw); if (!data || Array.isArray(data) || typeof data !== 'object') return new Response('Invalid data',{status:400});
   try { await initializeState(env.DB,data); } catch { return new Response('Already initialized or initialization failed',{status:409}); }
  } else if (request.method!=='GET') return new Response('Invalid method',{status:405});
  const state=await readState(env.DB); if (!state) return new Response('Not initialized',{status:404});
  return Response.json({sha256:await hash(JSON.stringify(state.data))});
 } catch { return new Response('Database error',{status:500}); }
}};
