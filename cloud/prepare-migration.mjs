// Reads the user's current local blog and prepares a local-only import plan.
// No network calls and no changes to the original files are made here.
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dataSource = await readFile(path.join(root,'blog-data.js'), 'utf8');
const match = dataSource.match(/^\s*window\.BLOG_DATA\s*=\s*([\s\S]*);\s*$/);
if (!match) throw new Error('本地博客数据格式无法识别，未生成导入文件');
const data = JSON.parse(match[1]);
const sandbox = {window:{}};
vm.runInNewContext(await readFile(path.join(root,'config.js'),'utf8'), sandbox, {timeout:1000});
const defaults = JSON.parse(JSON.stringify(sandbox.window.BLOG));
for (const field of ['posts','moments','projects']) if (!Array.isArray(data[field])) data[field] = defaults[field] || [];
if (!Array.isArray(data.albums)) data.albums = [];
data.settings = {...Object.fromEntries(['title','description','about','interests','timeline','github'].map(key => [key,defaults[key]])), ...(data.settings || {})};
for (const post of data.posts) {
  if (typeof post.body === 'string') continue;
  if (!/^posts\/[a-zA-Z0-9_-]+\.md$/.test(post.file || '')) throw new Error('文章引用路径无效');
  post.body = await readFile(path.join(root,post.file),'utf8');
}
const serialized = JSON.stringify(data);
if (serialized.length > 8_000_000) throw new Error('博客文本数据超过当前导入上限，未准备导入');
const app = await readFile(path.join(root,'app.js'),'utf8');
const paths = new Set([...serialized.matchAll(/\/personal\/uploads\/[a-f0-9-]{36}\.(?:png|jpg|webp|gif)/g)].map(m => m[0]));
for (const match of app.matchAll(/\/personal\/uploads\/[a-f0-9-]{36}\.(?:png|jpg|webp|gif)/g)) paths.add(match[0]);
for (const p of ['/personal/character.png','/personal/character-mask.png']) paths.add(p);
for (let i = 1; i <= 12; i++) paths.add(`/personal/wallpapers/wallpaper-${String(i).padStart(2,'0')}.png`);
const files = [];
for (const publicPath of [...paths].sort()) {
  const relative = publicPath.slice(1);
  const sourcePath = path.join(root,relative);
  let info;
  try { info = await stat(sourcePath); } catch { throw new Error(`引用的图片不存在：${relative}`); }
  if (!info.isFile()) throw new Error(`图片路径不是文件：${relative}`);
  files.push({key:relative, source:sourcePath, size:info.size});
}
const contentType = key => key.endsWith('.jpg') ? 'image/jpeg' : key.endsWith('.gif') ? 'image/gif' : key.endsWith('.webp') ? 'image/webp' : 'image/png';
for (const file of files) file.contentType = contentType(file.key);
if (process.argv.includes('--plan')) {
  console.log(JSON.stringify({posts:data.posts.length,moments:data.moments.length,albums:data.albums.length,images:files.length,totalImageBytes:files.reduce((n,f) => n + f.size,0), dataCharacters:serialized.length},null,2));
  process.exit(0);
}
if (!process.argv.includes('--prepare')) throw new Error('请明确指定 --plan 或 --prepare');
for (const file of files) file.sha256 = createHash('sha256').update(await readFile(file.source)).digest('hex');
const directory = path.join(here,'migration-local-v2');
await mkdir(directory,{recursive:true});
const revision = randomUUID();
const quote = s => `'${s.replaceAll("'", "''")}'`;
const chunks = [];
for (let i = 0; i < serialized.length;) {
  let end = Math.min(i + 20_000, serialized.length);
  const last = serialized.charCodeAt(end - 1);
  if (end < serialized.length && last >= 0xD800 && last <= 0xDBFF) end--;
  chunks.push(serialized.slice(i,end)); i = end;
}
const statements = chunks.map((chunk,i) => `INSERT INTO blog_chunks (revision, ordinal, content) SELECT ${quote(revision)}, ${i}, ${quote(chunk)} WHERE NOT EXISTS (SELECT 1 FROM blog_meta WHERE id = 1);`);
statements.push(`INSERT INTO blog_meta (id, revision) VALUES (1, ${quote(revision)});`);
// Use exclusive creation so an earlier prepared snapshot is never replaced.
await writeFile(path.join(directory,'seed.sql'), statements.join('\n')+'\n', {encoding:'utf8', flag:'wx'});
await writeFile(path.join(directory,'files.json'), JSON.stringify(files,null,2), {encoding:'utf8', flag:'wx'});
console.log(JSON.stringify({directory,posts:data.posts.length,moments:data.moments.length,albums:data.albums.length,images:files.length,totalImageBytes:files.reduce((n,f)=>n+f.size,0)},null,2));
