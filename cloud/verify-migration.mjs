// Verifies the prepared private snapshot in memory only; logs no content.
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const local = new DatabaseSync(':memory:');
local.exec(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
local.exec(await readFile(new URL('./migration-local-v2/seed.sql',import.meta.url),'utf8'));
const rows = local.prepare('SELECT c.ordinal, c.content FROM blog_meta m JOIN blog_chunks c ON c.revision = m.revision WHERE m.id = 1 ORDER BY c.ordinal').all();
if (!rows.length || rows.some((row,i) => row.ordinal !== i)) throw new Error('导入数据不完整');
const restored = JSON.parse(rows.map(row => row.content).join(''));
const originalText = await readFile(new URL('../blog-data.js',import.meta.url),'utf8');
const match = originalText.match(/^\s*window\.BLOG_DATA\s*=\s*([\s\S]*);\s*$/);
if (!match) throw new Error('本地博客数据格式变化');
const original = JSON.parse(match[1]);
for (const key of ['profile','activity','posts','moments','activityLog','albums']) {
  if (JSON.stringify(restored[key]) !== JSON.stringify(original[key])) throw new Error(`迁移数据校验失败：${key}`);
}
for (const [key,value] of Object.entries(original)) {
  if (['profile','activity','posts','moments','activityLog','albums','settings'].includes(key)) continue;
  if (!Object.hasOwn(restored,key) || JSON.stringify(restored[key]) !== JSON.stringify(value)) throw new Error(`迁移数据校验失败：${key}`);
}
for (const [key,value] of Object.entries(original.settings || {})) {
  if (JSON.stringify(restored.settings?.[key]) !== JSON.stringify(value)) throw new Error(`页面设置已变化：${key}`);
}
const files = JSON.parse(await readFile(new URL('./migration-local-v2/files.json',import.meta.url),'utf8'));
for (const file of files) {
  if (!file.sha256 || createHash('sha256').update(await readFile(file.source)).digest('hex') !== file.sha256) throw new Error('待迁移图片已变化，请重新准备');
}
const sql = await readFile(new URL('./migration-local-v2/seed.sql',import.meta.url),'utf8');
if (sql.split('\n').some(line => new TextEncoder().encode(line).length > 100_000)) throw new Error('导入语句超过数据库上限');
let refused = false;
try { local.exec(sql); } catch { refused = true; }
if (!refused) throw new Error('导入脚本没有阻止覆盖已有数据库');
console.log(JSON.stringify({verified:true,posts:restored.posts.length,moments:restored.moments.length,albums:restored.albums.length,images:files.length}));
