// Temporary localhost-only migration endpoint. Never deploy this helper.
const types = {png:'image/png',jpg:'image/jpeg',gif:'image/gif',webp:'image/webp'};
async function hash(bytes) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), x => x.toString(16).padStart(2,'0')).join(''); }
export default {async fetch(request, env) {
  if (!env.MIGRATION_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.MIGRATION_TOKEN}`) return new Response('Unauthorized',{status:401});
  const key = decodeURIComponent(new URL(request.url).pathname.slice(1));
  const match = key.match(/^personal\/(?:uploads\/[a-f0-9-]{36}\.(png|jpg|gif|webp)|wallpapers\/wallpaper-\d{2}\.(png)|character(?:-mask)?\.(png))$/);
  if (!match) return new Response('Invalid path',{status:400});
  const type = types[match[1] || match[2] || match[3]];
  if (request.method === 'PUT') {
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength || await hash(bytes) !== request.headers.get('X-Content-SHA256')) return new Response('Hash mismatch',{status:400});
    const headers = new Headers({'If-None-Match':'*'});
    const written = await env.IMAGES.put(key,bytes,{onlyIf:headers,httpMetadata:{contentType:type}});
    if (!written) return new Response('Already exists',{status:412});
  } else if (request.method !== 'GET') return new Response('Invalid method',{status:405});
  const stored = await env.IMAGES.get(key);
  if (!stored) return new Response('Not found',{status:404});
  return Response.json({sha256:await hash(await stored.arrayBuffer()),contentType:stored.httpMetadata?.contentType || '',size:stored.size});
}};
